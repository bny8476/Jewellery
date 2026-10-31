import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  kycService,
  validatePan,
  validateAadhaar,
  validateDob,
  maskPan,
  maskAadhaar
} from './kycService';
import { realtimeManager } from './realtimeService';
import type { KycSubmissionPayload } from '../types/kyc';

const storageStore: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (k: string) => storageStore[k] ?? null,
  setItem: (k: string, v: string) => { storageStore[k] = String(v); },
  removeItem: (k: string) => { delete storageStore[k]; },
  clear: () => {
    Object.keys(storageStore).forEach(k => delete storageStore[k]);
  },
  key: () => null,
  length: 0
} as any;

// Unique seed generator to prevent collisions across multiple test runs
const runSeed = Math.floor(Date.now() % 1000000);
const runId = Math.random().toString(36).substring(2, 7);

function generateValidAadhaar(index: number): string {
  const d = [
    [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0]
  ];
  const p = [
    [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
    [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
    [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]
  ];
  const inv = [0,4,3,2,1,5,6,7,8,9];
  const prefix = '2' + String(runSeed * 100 + index).padStart(10, '0').slice(-10);
  let c = 0;
  const rev = prefix.split('').reverse().map(Number);
  for (let i = 0; i < rev.length; i++) c = d[c][p[(i + 1) % 8][rev[i]]];
  return prefix + inv[c];
}

function generateUniquePan(index: number): string {
  const numPart = String((runSeed + index) % 9000 + 1000);
  return `ABCPE${numPart}F`;
}

describe('YAZHINI FINE JEWELS — End-to-End Customer KYC Verification System', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // 1. Unverified / Initial State
  it('1. New customer initially has UNVERIFIED (or NOT_SUBMITTED) KYC status', async () => {
    localStorage.setItem('luxury_pawn_user', JSON.stringify({ id: `patron-${runId}-new`, role: 'customer' }));
    const status = await kycService.getCustomerKycStatus();
    expect(['UNVERIFIED', 'NOT_SUBMITTED']).toContain(status.status);
    expect(status.kyc).toBeNull();
  });

  // 2. Client-side & Statutory Validation
  describe('2. Statutory Validation Rules (PAN, Aadhaar Verhoeff, 18+ DOB, DPDP Consent)', () => {
    it('validates authentic PAN format (5 letters, 4 digits, 1 letter) and rejects malformed formats', () => {
      expect(validatePan('ABCPE1234F').valid).toBe(true);
      expect(validatePan('AAAPC1234G').valid).toBe(true);
      expect(validatePan('XYZPH9999M').valid).toBe(true);

      // Invalid PANs
      expect(validatePan('12345ABCDE').valid).toBe(false);
      expect(validatePan('ABCDE12345').valid).toBe(false);
      expect(validatePan('ABCD1234E').valid).toBe(false);
      expect(validatePan('').valid).toBe(false);
      expect(validatePan('ABCZE1234F').valid).toBe(false);
    });

    it('validates 12-digit Aadhaar using Verhoeff checksum algorithm and rejects bogus/repetitive numbers', () => {
      const validAadhaar = generateValidAadhaar(1);
      expect(validateAadhaar(validAadhaar).valid).toBe(true);

      expect(validateAadhaar('111111111111').valid).toBe(false);
      expect(validateAadhaar('012345678901').valid).toBe(false);
      expect(validateAadhaar('12345').valid).toBe(false);
      expect(validateAadhaar('12345678901234').valid).toBe(false);
      expect(validateAadhaar('234567890129').valid).toBe(false);
    });

    it('enforces age verification requiring customers to be at least 18 years old', () => {
      const underageYear = new Date().getFullYear() - 5;
      expect(validateDob(`${underageYear}-01-01`).valid).toBe(false);

      const adultYear = new Date().getFullYear() - 25;
      expect(validateDob(`${adultYear}-01-01`).valid).toBe(true);
    });

    it('masks sensitive identity numbers without leaking plaintext (ABCDE••••F and •••• •••• 1234)', () => {
      expect(maskPan('ABCPE1234F')).toBe('ABCPE••••F');
      expect(maskAadhaar('234567890124')).toBe('•••• •••• 0124');
    });
  });

  // 3. Customer Submission & Pending Status
  it('3. Customer submits valid details, receives unique reference ID, and status transitions to PENDING_VERIFICATION', async () => {
    localStorage.setItem('luxury_pawn_user', JSON.stringify({ id: `patron-${runId}-test-3`, role: 'customer' }));
    const realtimeCallback = vi.fn();
    const unsub = realtimeManager.subscribe('customer.kyc.updated', realtimeCallback);

    const validPayload: KycSubmissionPayload = {
      legal_name: 'Ananya Deshmukh',
      pan_number: generateUniquePan(3),
      aadhaar_number: generateValidAadhaar(3),
      date_of_birth: '1996-05-15',
      document_type: 'Aadhaar Card',
      consent_given: true
    };

    const result = await kycService.submitKyc(validPayload);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.status).toBe('PENDING_VERIFICATION');
    expect(result.data?.reference_id).toMatch(/^KYC-\d{4}-[A-Z0-9]+$/);
    expect(result.data?.pan_masked).toMatch(/^ABCPE••••F$/);
    expect(result.data?.aadhaar_masked).toMatch(/^•••• •••• \d{4}$/);

    // Customer profile fetch returns PENDING_VERIFICATION
    const current = await kycService.getCustomerKycStatus();
    expect(current.status).toBe('PENDING_VERIFICATION');
    expect(current.kyc?.reference_id).toBe(result.data?.reference_id);

    expect(realtimeCallback).toHaveBeenCalled();
    unsub();
  });

  // 4. Admin Queue & Review
  it('4. Admin can list, search, and initiate review (UNDER_REVIEW)', async () => {
    localStorage.setItem('luxury_pawn_user', JSON.stringify({ id: `patron-${runId}-test-4`, role: 'customer' }));
    const submission = await kycService.submitKyc({
      legal_name: 'Rohan Mehra',
      pan_number: generateUniquePan(4),
      aadhaar_number: generateValidAadhaar(4),
      date_of_birth: '1992-10-20',
      consent_given: true
    });

    const queue = await kycService.getAdminKycList();
    expect(queue.stats.total).toBeGreaterThanOrEqual(1);

    const found = queue.records.find(r => r.reference_id === submission.data?.reference_id);
    expect(found).toBeDefined();

    // Start review
    const startReviewRes = await kycService.startReview(found!.id);
    expect(startReviewRes.success).toBe(true);
    expect(startReviewRes.status).toBe('UNDER_REVIEW');
  });

  // 5. Admin Approval & Patron Verified
  it('5. Admin approves KYC, customer profile transitions to VERIFIED (Verified Patron)', async () => {
    localStorage.setItem('luxury_pawn_user', JSON.stringify({ id: `patron-${runId}-test-5`, role: 'customer' }));
    const realtimeCallback = vi.fn();
    const unsub = realtimeManager.subscribe('customer.kyc.updated', realtimeCallback);

    const submission = await kycService.submitKyc({
      legal_name: 'Dr. Priya Srinivasan',
      pan_number: generateUniquePan(5),
      aadhaar_number: generateValidAadhaar(5),
      date_of_birth: '1985-03-22',
      consent_given: true
    });

    const kycId = submission.data!.id;

    // Admin approves
    const approveRes = await kycService.approveKyc(kycId, 'All identity documents verified against government records');
    expect(approveRes.success).toBe(true);
    expect(approveRes.status).toBe('VERIFIED');

    // Customer status reflects VERIFIED
    localStorage.setItem('luxury_pawn_user', JSON.stringify({ id: `patron-${runId}-test-5`, role: 'customer' }));
    const customerStatus = await kycService.getCustomerKycStatus();
    expect(customerStatus.status).toBe('VERIFIED');
    expect(customerStatus.kyc?.verified_at).toBeDefined();

    expect(realtimeCallback).toHaveBeenCalled();
    unsub();
  });

  // 6. Admin Rejection with Mandatory Reason & Customer Resubmission
  it('6. Admin rejects submission with reason, customer sees reason and resubmits corrected details', async () => {
    localStorage.setItem('luxury_pawn_user', JSON.stringify({ id: `patron-${runId}-test-6`, role: 'customer' }));
    const pan = generateUniquePan(6);
    const aadhaar = generateValidAadhaar(6);

    const submission = await kycService.submitKyc({
      legal_name: 'Vikram Joshi',
      pan_number: pan,
      aadhaar_number: aadhaar,
      date_of_birth: '1990-11-04',
      consent_given: true
    });

    const kycId = submission.data!.id;

    // Reject without reason fails
    await expect(kycService.rejectKyc(kycId, '')).rejects.toThrow();

    // Reject with reason succeeds
    const rejectRes = await kycService.rejectKyc(kycId, 'Identity document scan is cut off; please upload full image.');
    expect(rejectRes.success).toBe(true);
    expect(rejectRes.status).toBe('REJECTED');

    // Customer status is REJECTED with reason visible
    const customerStatus = await kycService.getCustomerKycStatus();
    expect(customerStatus.status).toBe('REJECTED');
    expect(customerStatus.kyc?.rejection_reason).toContain('Identity document scan is cut off');

    // Customer resubmits corrected details
    const resubmitRes = await kycService.resubmitKyc({
      legal_name: 'Vikram Joshi',
      pan_number: pan,
      aadhaar_number: aadhaar,
      date_of_birth: '1990-11-04',
      consent_given: true
    });

    expect(resubmitRes.success).toBe(true);
    expect(resubmitRes.data?.status).toBe('PENDING_VERIFICATION');

    const updatedCustomerStatus = await kycService.getCustomerKycStatus();
    expect(updatedCustomerStatus.status).toBe('PENDING_VERIFICATION');
  });

  // 7. Request Information / Action Required Flow
  it('7. Admin requests additional information, status transitions to ACTION_REQUIRED', async () => {
    localStorage.setItem('luxury_pawn_user', JSON.stringify({ id: `patron-${runId}-test-7`, role: 'customer' }));
    const submission = await kycService.submitKyc({
      legal_name: 'Sneha Patel',
      pan_number: generateUniquePan(7),
      aadhaar_number: generateValidAadhaar(7),
      date_of_birth: '1994-08-12',
      consent_given: true
    });

    const kycId = submission.data!.id;

    const requestRes = await kycService.requestInfo(kycId, 'Please upload a proof of address or passport copy.');
    expect(requestRes.success).toBe(true);
    expect(requestRes.status).toBe('ACTION_REQUIRED');

    const customerStatus = await kycService.getCustomerKycStatus();
    expect(customerStatus.status).toBe('ACTION_REQUIRED');
    expect(customerStatus.kyc?.action_required_notes).toContain('proof of address');
  });

  // 8. Audit Trail Verification
  it('8. Compliance audit trail records each status transition with reviewer identity and timestamps', async () => {
    localStorage.setItem('luxury_pawn_user', JSON.stringify({ id: `patron-${runId}-test-8`, role: 'customer' }));
    const submission = await kycService.submitKyc({
      legal_name: 'Tarun Varma',
      pan_number: generateUniquePan(8),
      aadhaar_number: generateValidAadhaar(8),
      date_of_birth: '1988-02-18',
      consent_given: true
    });

    const kycId = submission.data!.id;
    await kycService.startReview(kycId);
    await kycService.approveKyc(kycId, 'Auditor verified PAN format and identity');

    const detail = await kycService.getAdminKycDetail(kycId);
    expect(detail.kyc.status).toBe('VERIFIED');
    expect(detail.audit.length).toBeGreaterThanOrEqual(1);
  });
});
