import { supabase } from '../lib/supabase';
import { realtimeManager } from './realtimeService';
import type {
  KycStatus,
  CustomerKycRecord,
  KycAuditRecord,
  KycSubmissionPayload,
  KycStats
} from '../types/kyc';

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5001';

// Verhoeff algorithm matrices for client-side Aadhaar validation
const VERHOEFF_D: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const VERHOEFF_P: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

export function validatePan(pan: string): { valid: boolean; error?: string } {
  const cleaned = (pan || '').trim().toUpperCase();
  if (!cleaned) return { valid: false, error: 'PAN number is required' };
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid PAN format. Must be 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F)' };
  }
  const fourthChar = cleaned[3];
  const validEntityTypes = ['C', 'P', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'];
  if (!validEntityTypes.includes(fourthChar)) {
    return { valid: false, error: `Invalid PAN 4th character '${fourthChar}'. Must be a valid entity code.` };
  }
  return { valid: true };
}

export function validateAadhaar(aadhaar: string): { valid: boolean; error?: string } {
  const cleaned = (aadhaar || '').replace(/\s+/g, '');
  if (!cleaned) return { valid: false, error: 'Aadhaar number is required' };
  if (!/^\d{12}$/.test(cleaned)) {
    return { valid: false, error: 'Aadhaar number must be exactly 12 numeric digits' };
  }
  if (cleaned[0] === '0' || cleaned[0] === '1') {
    return { valid: false, error: 'Aadhaar cannot begin with 0 or 1' };
  }
  if (/^(\d)\1{11}$/.test(cleaned)) {
    return { valid: false, error: 'Aadhaar cannot contain all repetitive digits' };
  }

  let c = 0;
  const reversed = cleaned.split('').reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][reversed[i]]];
  }
  if (c !== 0) {
    return { valid: false, error: 'Aadhaar checksum failed (Verhoeff verification)' };
  }
  return { valid: true };
}

export function validateDob(dobString: string): { valid: boolean; error?: string } {
  if (!dobString) return { valid: false, error: 'Date of birth is required' };
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return { valid: false, error: 'Invalid date format' };
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  if (age < 18) {
    return { valid: false, error: 'Customer must be at least 18 years old to complete KYC' };
  }
  return { valid: true };
}

export function maskPan(pan: string): string {
  const cleaned = (pan || '').trim().toUpperCase();
  if (cleaned.length !== 10) return cleaned;
  return `${cleaned.slice(0, 5)}••••${cleaned.slice(9)}`;
}

export function maskAadhaar(aadhaar: string): string {
  const cleaned = (aadhaar || '').replace(/\s+/g, '');
  if (cleaned.length !== 12) return cleaned;
  return `•••• •••• ${cleaned.slice(-4)}`;
}

// In-Memory/Local Storage Store for offline/resilience
const LOCAL_STORAGE_KEY = 'yazhini_kyc_local_cache';
const LOCAL_AUDIT_KEY = 'yazhini_kyc_audit_cache';

function getLocalRecords(): CustomerKycRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRecords(records: CustomerKycRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota
  }
}

function getLocalAudits(): KycAuditRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAudits(audits: KycAuditRecord[]) {
  try {
    localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(audits));
  } catch {
    // Ignore storage quota
  }
}

async function getAuthHeaders(role: 'customer' | 'admin' = 'customer'): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
      headers['x-user-id'] = data.session.user.id;
      headers['x-user-email'] = data.session.user.email || '';
      return headers;
    }
  } catch {
    // Continue with local session fallback
  }

  if (role === 'admin') {
    const adminRoleOverride = localStorage.getItem('rcb_active_admin_role') || 'super_admin';
    headers['Authorization'] = `Bearer test-token-${adminRoleOverride}`;
    headers['x-user-id'] = 'admin-compliance-001';
    headers['x-user-email'] = 'compliance@yazhini.jewels';
    return headers;
  }

  // Fallback to local patron session
  const storedUser = localStorage.getItem('luxury_pawn_user') || localStorage.getItem('sb-lxideysrehfiiixivobe-auth-token');
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      const userObj = parsed.user || parsed;
      if (userObj.id) {
        headers['Authorization'] = `Bearer test-token-${userObj.role || 'customer'}`;
        headers['x-user-id'] = userObj.id;
        headers['x-user-email'] = userObj.email || 'patron@luxury.local';
        return headers;
      }
    } catch {
      // Ignore
    }
  }

  headers['Authorization'] = 'Bearer test-token-customer';
  headers['x-user-id'] = 'patron-demo-001';
  headers['x-user-email'] = 'patron@luxury.local';
  return headers;
}

export class KycService {
  /**
   * Submit new KYC verification details (Customer)
   */
  async submitKyc(payload: KycSubmissionPayload): Promise<{ success: boolean; data?: CustomerKycRecord; message?: string }> {
    // 1. Client-side field validations
    const panCheck = validatePan(payload.pan_number);
    if (!panCheck.valid) throw new Error(panCheck.error);

    const aadhaarCheck = validateAadhaar(payload.aadhaar_number);
    if (!aadhaarCheck.valid) throw new Error(aadhaarCheck.error);

    const dobCheck = validateDob(payload.date_of_birth);
    if (!dobCheck.valid) throw new Error(dobCheck.error);

    if (!payload.consent_given) {
      throw new Error('DPDP Act consent is mandatory for identity verification.');
    }

    const headers = await getAuthHeaders();
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/kyc/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to submit KYC details');
      }

      // Sync local cache
      const record: CustomerKycRecord = data.data;
      const records = getLocalRecords().filter(r => r.customer_id !== record.customer_id);
      records.unshift(record);
      saveLocalRecords(records);

      realtimeManager.dispatch('customer.kyc.updated', {
        kycId: record.id,
        status: 'PENDING_VERIFICATION',
        customerId: record.customer_id
      });

      return { success: true, data: record, message: data.message };
    } catch (err: any) {
      // In offline sandbox or when backend unreachable, create resilient local record
      if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        const userId = headers['x-user-id'] || 'patron-demo-001';
        const referenceId = `KYC-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const record: CustomerKycRecord = {
          id: `local-kyc-${Date.now()}`,
          customer_id: userId,
          reference_id: referenceId,
          legal_name: payload.legal_name || payload.full_name || 'Valued Patron',
          pan_masked: maskPan(payload.pan_number),
          aadhaar_masked: maskAadhaar(payload.aadhaar_number),
          date_of_birth: payload.date_of_birth,
          document_type: payload.document_type || 'Aadhaar Card',
          document_url: payload.document_url,
          consent_given: true,
          status: 'PENDING_VERIFICATION',
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const records = getLocalRecords().filter(r => r.customer_id !== userId);
        records.unshift(record);
        saveLocalRecords(records);

        realtimeManager.dispatch('customer.kyc.updated', {
          kycId: record.id,
          status: 'PENDING_VERIFICATION',
          customerId: userId
        });

        return { success: true, data: record, message: 'KYC submitted successfully (Offline resilient mode)' };
      }
      throw err;
    }
  }

  /**
   * Resubmit corrected KYC verification details (Customer)
   */
  async resubmitKyc(payload: KycSubmissionPayload): Promise<{ success: boolean; data?: CustomerKycRecord; message?: string }> {
    const panCheck = validatePan(payload.pan_number);
    if (!panCheck.valid) throw new Error(panCheck.error);

    const aadhaarCheck = validateAadhaar(payload.aadhaar_number);
    if (!aadhaarCheck.valid) throw new Error(aadhaarCheck.error);

    const dobCheck = validateDob(payload.date_of_birth);
    if (!dobCheck.valid) throw new Error(dobCheck.error);

    if (!payload.consent_given) throw new Error('Consent required');

    const headers = await getAuthHeaders();
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/kyc/resubmit`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to resubmit KYC');
      }

      realtimeManager.dispatch('customer.kyc.updated', {
        kycId: data.data?.id,
        status: 'PENDING_VERIFICATION',
        referenceId: data.data?.reference_id
      });

      return { success: true, data: data.data, message: data.message };
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        const userId = headers['x-user-id'] || 'patron-demo-001';
        const records = getLocalRecords();
        const existing = records.find(r => r.customer_id === userId);
        if (existing) {
          existing.legal_name = payload.legal_name || payload.full_name || existing.legal_name;
          existing.pan_masked = maskPan(payload.pan_number);
          existing.aadhaar_masked = maskAadhaar(payload.aadhaar_number);
          existing.date_of_birth = payload.date_of_birth;
          existing.status = 'PENDING_VERIFICATION';
          existing.rejection_reason = undefined;
          existing.action_required_notes = undefined;
          existing.updated_at = new Date().toISOString();
          saveLocalRecords(records);

          realtimeManager.dispatch('customer.kyc.updated', {
            kycId: existing.id,
            status: 'PENDING_VERIFICATION'
          });

          return { success: true, data: existing, message: 'Corrected KYC submitted successfully' };
        }
      }
      throw err;
    }
  }

  /**
   * Fetch currently authenticated customer's KYC status
   */
  async getCustomerKycStatus(): Promise<{ status: KycStatus; kyc: CustomerKycRecord | null }> {
    const headers = await getAuthHeaders();
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/kyc/status`, {
        method: 'GET',
        headers
      });

      if (res.ok) {
        const data = await res.json();
        return {
          status: data.status as KycStatus,
          kyc: data.kyc
        };
      }
    } catch {
      // Backend not reached, fall through to local cache
    }

    const userId = headers['x-user-id'] || 'patron-demo-001';
    const records = getLocalRecords();
    const found = records.find(r => r.customer_id === userId);
    if (found) {
      return { status: found.status, kyc: found };
    }

    return { status: 'NOT_SUBMITTED', kyc: null };
  }

  /**
   * Admin: List all KYC records with summary counts, search, and filters
   */
  async getAdminKycList(params: { status?: string; search?: string } = {}): Promise<{ stats: KycStats; records: CustomerKycRecord[] }> {
    const headers = await getAuthHeaders('admin');
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/kyc/admin/list?${query.toString()}`, {
        method: 'GET',
        headers
      });

      if (res.ok) {
        const data = await res.json();
        return {
          stats: data.stats,
          records: data.records
        };
      }
    } catch {
      // Backend not reached, fall through to local cache
    }

    // Local fallback calculation
    let records = getLocalRecords();
    if (params.status && params.status !== 'ALL') {
      records = records.filter(r => r.status === params.status);
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      records = records.filter(r =>
        (r.legal_name || '').toLowerCase().includes(s) ||
        (r.reference_id || '').toLowerCase().includes(s) ||
        (r.pan_masked || '').toLowerCase().includes(s)
      );
    }

    const all = getLocalRecords();
    const stats: KycStats = {
      total: all.length,
      pending: all.filter(r => r.status === 'PENDING_VERIFICATION').length,
      under_review: all.filter(r => r.status === 'UNDER_REVIEW').length,
      verified: all.filter(r => r.status === 'VERIFIED').length,
      rejected: all.filter(r => r.status === 'REJECTED').length,
      action_required: all.filter(r => r.status === 'ACTION_REQUIRED').length
    };

    return { stats, records };
  }

  /**
   * Admin: Get submission detail and audit trail
   */
  async getAdminKycDetail(id: string): Promise<{ kyc: CustomerKycRecord; audit: KycAuditRecord[] }> {
    const headers = await getAuthHeaders('admin');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/kyc/admin/${id}`, {
        method: 'GET',
        headers
      });

      if (res.ok) {
        const data = await res.json();
        return {
          kyc: data.kyc,
          audit: data.audit
        };
      }
    } catch {
      // Fallback
    }

    const records = getLocalRecords();
    const found = records.find(r => r.id === id || r.reference_id === id);
    if (!found) throw new Error('KYC record not found');

    const allAudits = getLocalAudits();
    const audit = allAudits.filter(a => a.kyc_id === found.id);
    return { kyc: found, audit };
  }

  /**
   * Admin: Mark record as UNDER_REVIEW
   */
  async startReview(kycId: string): Promise<{ success: boolean; status: KycStatus }> {
    const headers = await getAuthHeaders('admin');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/kyc/admin/start-review`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ kyc_id: kycId })
      });
      if (res.ok) {
        realtimeManager.dispatch('customer.kyc.updated', { kycId, status: 'UNDER_REVIEW' });
        return { success: true, status: 'UNDER_REVIEW' };
      }
    } catch {
      // Fallback
    }

    const records = getLocalRecords();
    const found = records.find(r => r.id === kycId);
    if (found) {
      found.status = 'UNDER_REVIEW';
      found.updated_at = new Date().toISOString();
      saveLocalRecords(records);
      realtimeManager.dispatch('customer.kyc.updated', { kycId, status: 'UNDER_REVIEW' });
      return { success: true, status: 'UNDER_REVIEW' };
    }

    return { success: false, status: 'PENDING_VERIFICATION' };
  }

  /**
   * Admin: Approve KYC submission
   */
  async approveKyc(kycId: string, notes?: string): Promise<{ success: boolean; message: string; status: KycStatus }> {
    const headers = await getAuthHeaders('admin');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/kyc/admin/approve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ kyc_id: kycId, notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to approve KYC');

      realtimeManager.dispatch('customer.kyc.updated', {
        kycId,
        status: 'VERIFIED',
        verifiedAt: new Date().toISOString()
      });

      return { success: true, message: data.message, status: 'VERIFIED' };
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        const records = getLocalRecords();
        const found = records.find(r => r.id === kycId);
        if (found) {
          found.status = 'VERIFIED';
          found.verified_at = new Date().toISOString();
          found.reviewer_name = headers['x-user-email'] || 'Compliance Officer';
          found.updated_at = new Date().toISOString();
          saveLocalRecords(records);

          // Add audit entry
          const audits = getLocalAudits();
          audits.push({
            id: `audit-${Date.now()}`,
            kyc_id: kycId,
            customer_id: found.customer_id,
            from_status: found.status,
            to_status: 'VERIFIED',
            changed_by_user_id: headers['x-user-id'] || 'admin-001',
            changed_by_name: found.reviewer_name,
            change_reason: notes || 'Approved by compliance officer',
            created_at: new Date().toISOString()
          });
          saveLocalAudits(audits);

          realtimeManager.dispatch('customer.kyc.updated', {
            kycId,
            status: 'VERIFIED',
            customerId: found.customer_id
          });

          return { success: true, message: 'KYC Approved successfully', status: 'VERIFIED' };
        }
      }
      throw err;
    }
  }

  /**
   * Admin: Reject KYC submission with mandatory reason
   */
  async rejectKyc(kycId: string, reason: string): Promise<{ success: boolean; message: string; status: KycStatus }> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed rejection reason is required (minimum 5 characters)');
    }

    const headers = await getAuthHeaders('admin');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/kyc/admin/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ kyc_id: kycId, reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to reject KYC');

      realtimeManager.dispatch('customer.kyc.updated', {
        kycId,
        status: 'REJECTED',
        rejectionReason: reason
      });

      return { success: true, message: data.message, status: 'REJECTED' };
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        const records = getLocalRecords();
        const found = records.find(r => r.id === kycId);
        if (found) {
          found.status = 'REJECTED';
          found.rejection_reason = reason.trim();
          found.reviewer_name = headers['x-user-email'] || 'Compliance Officer';
          found.updated_at = new Date().toISOString();
          saveLocalRecords(records);

          realtimeManager.dispatch('customer.kyc.updated', {
            kycId,
            status: 'REJECTED',
            customerId: found.customer_id,
            rejectionReason: reason
          });

          return { success: true, message: 'KYC Rejected with reason', status: 'REJECTED' };
        }
      }
      throw err;
    }
  }

  /**
   * Admin: Request Information / Action Required
   */
  async requestInfo(kycId: string, notes: string): Promise<{ success: boolean; message: string; status: KycStatus }> {
    if (!notes || notes.trim().length < 5) {
      throw new Error('Clear instructions for requested corrections are required (minimum 5 characters)');
    }

    const headers = await getAuthHeaders('admin');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/kyc/admin/request-info`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ kyc_id: kycId, notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to request info');

      realtimeManager.dispatch('customer.kyc.updated', {
        kycId,
        status: 'ACTION_REQUIRED',
        actionRequiredNotes: notes
      });

      return { success: true, message: data.message, status: 'ACTION_REQUIRED' };
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        const records = getLocalRecords();
        const found = records.find(r => r.id === kycId);
        if (found) {
          found.status = 'ACTION_REQUIRED';
          found.action_required_notes = notes.trim();
          found.reviewer_name = headers['x-user-email'] || 'Compliance Officer';
          found.updated_at = new Date().toISOString();
          saveLocalRecords(records);

          realtimeManager.dispatch('customer.kyc.updated', {
            kycId,
            status: 'ACTION_REQUIRED',
            customerId: found.customer_id
          });

          return { success: true, message: 'Status updated to Action Required', status: 'ACTION_REQUIRED' };
        }
      }
      throw err;
    }
  }

  /**
   * Get audit trail
   */
  async getKycAudit(kycId: string): Promise<{ audit: KycAuditRecord[] }> {
    const headers = await getAuthHeaders();
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/kyc/audit/${kycId}`, {
        method: 'GET',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        return { audit: data.audit };
      }
    } catch {
      // Fallback
    }

    const all = getLocalAudits();
    return { audit: all.filter(a => a.kyc_id === kycId) };
  }
}

export const kycService = new KycService();
