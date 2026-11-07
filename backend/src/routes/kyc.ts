import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { queryDb, getDbPool, supabase, supabaseAdmin, memoryStore, isSupabaseConfigured } from '../db.ts';
import { authenticateRequest, broadcastRealtimeEvent, STAFF_ROLES, hasPermission, requirePermission } from './apiV1.ts';
import { createAndDispatchNotification } from '../services/notificationService.ts';
import { logSecurityAuditEvent } from '../services/auditLogger.ts';
import {
  validateAadhaar,
  validatePan,
  validateDateOfBirth,
  maskPan,
  maskAadhaar,
  hashSensitiveIdentifier,
  generateKycReferenceId
} from '../services/kycValidator.ts';

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// Convert user ID to UUID or safe format
function toValidUuid(rawId: string): string {
  if (!rawId) return '00000000-0000-0000-0000-000000000001';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(rawId)) return rawId;
  const hash = crypto.createHash('md5').update(rawId).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

// Helper to map DB record safely supporting dual column naming schemes
function mapDbKycRecord(k: any): any {
  if (!k) return null;
  return {
    id: k.id,
    customer_id: k.customer_id,
    user_id: k.user_id,
    reference_id: k.reference_id || k.kyc_reference || `KYC-${String(k.id || '').slice(0, 8).toUpperCase()}`,
    legal_name: k.legal_name || k.full_name || 'Valued Patron',
    pan_masked: k.pan_masked || k.pan_number_masked || '',
    aadhaar_masked: k.aadhaar_masked || k.aadhaar_number_masked || '',
    date_of_birth: k.date_of_birth,
    document_type: k.document_type || k.id_proof_type || 'Aadhaar Card',
    document_url: k.document_url,
    consent_given: k.consent_given ?? true,
    status: (k.status || 'PENDING_VERIFICATION').toUpperCase(),
    rejection_reason: k.rejection_reason,
    action_required_notes: k.action_required_notes,
    reviewer_id: k.reviewer_id,
    reviewer_name: k.reviewer_name || k.reviewer_email || '',
    verified_at: k.verified_at,
    submitted_at: k.submitted_at || k.consent_timestamp || k.created_at || new Date().toISOString(),
    created_at: k.created_at || new Date().toISOString(),
    updated_at: k.updated_at || new Date().toISOString(),
    customer_code: k.customer_code || k.customers?.customer_code || '',
    customer_email: k.customer_email || k.customers?.email || '',
    customer_phone: k.customer_phone || k.customers?.phone || ''
  };
}

// Fetch Admin KYC Queue with dual-engine fallback (Postgres Pool -> Supabase REST -> In-Memory)
async function fetchAdminKycQueue(statusFilter?: string, searchQuery?: string): Promise<{ stats: any; records: any[] }> {
  let stats = { total: 0, pending: 0, under_review: 0, verified: 0, rejected: 0, action_required: 0 };
  let rawRecords: any[] = [];
  let fetchedViaPg = false;

  // Engine 1: Direct PostgreSQL Pool
  const pool = getDbPool();
  if (pool) {
    try {
      const statsQuery = await queryDb(
        `SELECT 
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE UPPER(status) IN ('PENDING', 'PENDING_VERIFICATION')) as pending,
           COUNT(*) FILTER (WHERE UPPER(status) = 'UNDER_REVIEW') as under_review,
           COUNT(*) FILTER (WHERE UPPER(status) = 'VERIFIED') as verified,
           COUNT(*) FILTER (WHERE UPPER(status) = 'REJECTED') as rejected,
           COUNT(*) FILTER (WHERE UPPER(status) = 'ACTION_REQUIRED') as action_required
         FROM customer_kyc`
      );

      if (statsQuery && statsQuery.length > 0) {
        stats = {
          total: parseInt(statsQuery[0].total || '0', 10),
          pending: parseInt(statsQuery[0].pending || '0', 10),
          under_review: parseInt(statsQuery[0].under_review || '0', 10),
          verified: parseInt(statsQuery[0].verified || '0', 10),
          rejected: parseInt(statsQuery[0].rejected || '0', 10),
          action_required: parseInt(statsQuery[0].action_required || '0', 10)
        };
      }

      let sql = `
        SELECT k.*,
               c.customer_code, c.email as customer_email, c.phone as customer_phone
        FROM customer_kyc k
        LEFT JOIN customers c ON k.customer_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (statusFilter && statusFilter !== 'ALL') {
        params.push(statusFilter.toUpperCase());
        sql += ` AND UPPER(k.status) = ${params.length}`;
      }

      if (searchQuery) {
        params.push(`%${searchQuery}%`);
        sql += ` AND (
          COALESCE(k.legal_name, k.full_name, '') ILIKE ${params.length} OR 
          COALESCE(k.reference_id, k.kyc_reference, '') ILIKE ${params.length} OR 
          COALESCE(k.pan_masked, k.pan_number_masked, '') ILIKE ${params.length} OR 
          c.email ILIKE ${params.length}
        )`;
      }

      sql += ` ORDER BY COALESCE(k.submitted_at, k.created_at) DESC`;

      rawRecords = await queryDb(sql, params);
      fetchedViaPg = true;
      return {
        stats,
        records: (rawRecords || []).map(mapDbKycRecord)
      };
    } catch (pgErr: any) {
      console.warn('[KYC Query Warning] PostgreSQL query failed, attempting Supabase REST API:', pgErr?.message);
    }
  }

  // Engine 2: Supabase REST API via Service Role Key (bypasses RLS)
  if (!fetchedViaPg && supabaseAdmin && isSupabaseConfigured()) {
    try {
      let query = supabaseAdmin
        .from('customer_kyc')
        .select('*, customers(customer_code, email, phone)');

      if (statusFilter && statusFilter !== 'ALL') {
        query = query.ilike('status', statusFilter);
      }

      if (searchQuery) {
        query = query.or(`legal_name.ilike.%${searchQuery}%,reference_id.ilike.%${searchQuery}%,pan_masked.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        const records = data.map(mapDbKycRecord);
        const { data: allRows } = await supabaseAdmin.from('customer_kyc').select('status');
        const rows = allRows || [];

        stats = {
          total: rows.length,
          pending: rows.filter((r: any) => ['PENDING', 'PENDING_VERIFICATION'].includes((r.status || '').toUpperCase())).length,
          under_review: rows.filter((r: any) => (r.status || '').toUpperCase() === 'UNDER_REVIEW').length,
          verified: rows.filter((r: any) => (r.status || '').toUpperCase() === 'VERIFIED').length,
          rejected: rows.filter((r: any) => (r.status || '').toUpperCase() === 'REJECTED').length,
          action_required: rows.filter((r: any) => (r.status || '').toUpperCase() === 'ACTION_REQUIRED').length
        };

        return { stats, records };
      }
      if (error) {
        const isNetworkErr = error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND') || error.message?.includes('network');
        if (isNetworkErr) {
          console.info('[KYC Supabase REST]: Remote endpoint unreachable (using in-memory fallback).');
        } else {
          console.warn('[KYC Supabase REST Error]:', error.message);
        }
      }
    } catch (sbErr: any) {
      const isNetworkErr = sbErr?.message?.includes('fetch failed') || sbErr?.message?.includes('ENOTFOUND');
      if (isNetworkErr) {
        console.info('[KYC Supabase REST]: Remote endpoint unreachable (using in-memory fallback).');
      } else {
        console.warn('[KYC Supabase Exception]:', sbErr?.message);
      }
    }
  }

  // Engine 3: Memory Store Fallback
  const memList = memoryStore.customer_kyc || [];
  let filtered = [...memList];
  if (statusFilter && statusFilter !== 'ALL') {
    filtered = filtered.filter(r => (r.status || '').toUpperCase() === statusFilter.toUpperCase());
  }
  if (searchQuery) {
    const s = searchQuery.toLowerCase();
    filtered = filtered.filter(r =>
      (r.legal_name || r.full_name || '').toLowerCase().includes(s) ||
      (r.reference_id || r.kyc_reference || '').toLowerCase().includes(s) ||
      (r.pan_masked || r.pan_number_masked || '').toLowerCase().includes(s)
    );
  }

  return {
    stats: {
      total: memList.length,
      pending: memList.filter(r => ['PENDING', 'PENDING_VERIFICATION'].includes((r.status || '').toUpperCase())).length,
      under_review: memList.filter(r => (r.status || '').toUpperCase() === 'UNDER_REVIEW').length,
      verified: memList.filter(r => (r.status || '').toUpperCase() === 'VERIFIED').length,
      rejected: memList.filter(r => (r.status || '').toUpperCase() === 'REJECTED').length,
      action_required: memList.filter(r => (r.status || '').toUpperCase() === 'ACTION_REQUIRED').length
    },
    records: filtered.map(mapDbKycRecord)
  };
}

export async function handleKycRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string
): Promise<boolean> {
  if (!pathname.startsWith('/api/v1/kyc')) {
    return false;
  }

  // Helper auth check
  const auth = await authenticateRequest(req);
  const user = auth.user;
  const isStaff = auth.isStaff;

  // 1. POST /api/v1/kyc/submit - Customer submits KYC details
  if (pathname === '/api/v1/kyc/submit' && req.method === 'POST') {
    if (!user) {
      sendJson(res, 401, { error: 'Authentication required to submit KYC verification.' });
      return true;
    }

    const body = (req as any).body || {};
    const {
      legal_name,
      pan_number,
      aadhaar_number,
      date_of_birth,
      document_type,
      document_url,
      consent_given
    } = body;

    // Consent validation
    if (!consent_given) {
      sendJson(res, 400, {
        error: 'Consent required',
        message: 'You must provide consent for collecting and verifying your identity information under the DPDP Act.'
      });
      return true;
    }

    // Name validation
    if (!legal_name || typeof legal_name !== 'string' || legal_name.trim().length < 3) {
      sendJson(res, 400, {
        error: 'Invalid legal name',
        message: 'Full legal name as per government identity document must be at least 3 characters.'
      });
      return true;
    }

    // PAN validation
    const panResult = validatePan(pan_number);
    if (!panResult.valid) {
      sendJson(res, 400, {
        error: 'Invalid PAN',
        message: panResult.error
      });
      return true;
    }

    // Aadhaar validation (Verhoeff)
    const aadhaarResult = validateAadhaar(aadhaar_number);
    if (!aadhaarResult.valid) {
      sendJson(res, 400, {
        error: 'Invalid Aadhaar',
        message: aadhaarResult.error
      });
      return true;
    }

    // Date of Birth validation (18+ requirement)
    const dobResult = validateDateOfBirth(date_of_birth);
    if (!dobResult.valid) {
      sendJson(res, 400, {
        error: 'Invalid Date of Birth',
        message: dobResult.error
      });
      return true;
    }

    const customerId = toValidUuid(user.id);
    const maskedPan = maskPan(pan_number);
    const maskedAadhaar = maskAadhaar(aadhaar_number);
    const panHash = hashSensitiveIdentifier(pan_number);
    const aadhaarHash = hashSensitiveIdentifier(aadhaar_number);

    // Duplicate submission check against verified patrons
    try {
      const existingConflict = await queryDb(
        `SELECT id, customer_id, status FROM customer_kyc 
         WHERE (pan_hash = $1 OR aadhaar_hash = $2) 
         AND customer_id != $3 
         AND status = 'VERIFIED' LIMIT 1`,
        [panHash, aadhaarHash, customerId]
      );

      if (existingConflict && existingConflict.length > 0) {
        sendJson(res, 409, {
          error: 'Identity Conflict',
          message: 'This PAN or Aadhaar number is already linked to another verified account. Please contact support.'
        });
        return true;
      }

      // Check if this customer already has a pending or verified KYC
      const existingCustomerKyc = await queryDb(
        `SELECT id, status, reference_id FROM customer_kyc WHERE customer_id = $1 LIMIT 1`,
        [customerId]
      );

      if (existingCustomerKyc && existingCustomerKyc.length > 0) {
        const currentKyc = existingCustomerKyc[0];
        if (currentKyc.status === 'VERIFIED') {
          sendJson(res, 400, {
            error: 'Already Verified',
            message: 'Your KYC verification is already completed and approved.',
            reference_id: currentKyc.reference_id
          });
          return true;
        }
        if (currentKyc.status === 'PENDING_VERIFICATION' || currentKyc.status === 'UNDER_REVIEW') {
          sendJson(res, 400, {
            error: 'Submission Pending',
            message: 'You already have a KYC verification under review. Please wait for an administrator to review it.',
            reference_id: currentKyc.reference_id
          });
          return true;
        }
      }

      const referenceId = generateKycReferenceId();
      const kycId = crypto.randomUUID();

      // Upsert record into customer_kyc
      let savedRecord: any = null;
      if (existingCustomerKyc && existingCustomerKyc.length > 0) {
        const updated = await queryDb(
          `UPDATE customer_kyc SET
             reference_id = $1,
             legal_name = $2,
             pan_masked = $3,
             pan_hash = $4,
             aadhaar_masked = $5,
             aadhaar_hash = $6,
             date_of_birth = $7,
             document_type = $8,
             document_url = $9,
             consent_given = $10,
             consent_timestamp = NOW(),
             status = 'PENDING_VERIFICATION',
             rejection_reason = NULL,
             action_required_notes = NULL,
             submitted_at = NOW(),
             updated_at = NOW()
           WHERE customer_id = $11
           RETURNING *`,
          [
            referenceId,
            legal_name.trim(),
            maskedPan,
            panHash,
            maskedAadhaar,
            aadhaarHash,
            date_of_birth,
            document_type || 'Aadhaar Card',
            document_url || null,
            true,
            customerId
          ]
        );
        savedRecord = updated && updated.length > 0 ? updated[0] : null;
      } else {
        const inserted = await queryDb(
          `INSERT INTO customer_kyc (
             id, customer_id, reference_id, legal_name,
             pan_masked, pan_hash, aadhaar_masked, aadhaar_hash,
             date_of_birth, document_type, document_url,
             consent_given, consent_timestamp, status,
             submitted_at, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), 'PENDING_VERIFICATION', NOW(), NOW(), NOW()
           ) RETURNING *`,
          [
            kycId,
            customerId,
            referenceId,
            legal_name.trim(),
            maskedPan,
            panHash,
            maskedAadhaar,
            aadhaarHash,
            date_of_birth,
            document_type || 'Aadhaar Card',
            document_url || null,
            true
          ]
        );
        savedRecord = inserted && inserted.length > 0 ? inserted[0] : null;
      }

      // Record in audit log
      await queryDb(
        `INSERT INTO customer_kyc_audit (
           id, kyc_id, customer_id, from_status, to_status,
           changed_by_user_id, changed_by_name, change_reason, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          crypto.randomUUID(),
          savedRecord?.id || kycId,
          customerId,
          'NOT_SUBMITTED',
          'PENDING_VERIFICATION',
          user.id,
          legal_name.trim(),
          'Initial KYC details submitted by customer'
        ]
      );

      // Update customers table kyc_status in PostgreSQL
      try {
        const updateRes = await queryDb(
          `UPDATE customers 
           SET kyc_status = 'PENDING', full_name = $1, date_of_birth = $2, 
               pan_number_masked = $3, aadhaar_number_masked = $4, updated_at = NOW() 
           WHERE id = $5 OR user_id = $5 
           RETURNING id`,
          [legal_name.trim(), date_of_birth, maskedPan, maskedAadhaar, customerId]
        );

        if (!updateRes || updateRes.length === 0) {
          // If customer record does not exist yet, create it with UNVERIFIED -> PENDING
          const fallbackPhone = (user as any).phone || `98${Math.floor(10000000 + Math.random() * 90000000)}`;
          await queryDb(
            `INSERT INTO customers (
               id, user_id, customer_code, full_name, phone, email, address,
               date_of_birth, pan_number_masked, aadhaar_number_masked, kyc_status,
               created_at, updated_at
             ) VALUES (
               $1, $1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', NOW(), NOW()
             ) ON CONFLICT (id) DO UPDATE SET 
               kyc_status = 'PENDING', full_name = EXCLUDED.full_name, 
               date_of_birth = EXCLUDED.date_of_birth, 
               pan_number_masked = EXCLUDED.pan_number_masked, 
               aadhaar_number_masked = EXCLUDED.aadhaar_number_masked, 
               updated_at = NOW()`,
            [
              customerId,
              `CUST-${Date.now().toString().slice(-6)}`,
              legal_name.trim(),
              fallbackPhone,
              (user as any).email || null,
              'Address pending document verification',
              date_of_birth,
              maskedPan,
              maskedAadhaar
            ]
          );
        }
      } catch (custErr: any) {
        console.error('[KYC Submit] Customer record update error:', custErr);
      }

      // Notifications
      await createAndDispatchNotification({
        recipient_id: user.id,
        recipient_role: 'customer',
        event_type: 'kyc.submitted',
        category: 'security',
        severity: 'info',
        title: 'KYC Submitted for Verification',
        message: `Your identity verification details (${referenceId}) have been submitted and are pending compliance review.`,
        related_entity_type: 'customer_kyc',
        related_entity_id: savedRecord?.id || kycId,
        destination_route: '/dashboard'
      });

      // Staff notification
      await createAndDispatchNotification({
        recipient_id: 'admin_all',
        recipient_role: 'admin',
        event_type: 'kyc.pending_review',
        category: 'security',
        severity: 'warning',
        title: 'New Customer KYC Pending Review',
        message: `${legal_name.trim()} submitted KYC details (${referenceId}) for compliance verification.`,
        related_entity_type: 'customer_kyc',
        related_entity_id: savedRecord?.id || kycId,
        destination_route: '/admin'
      });

      // Broadcast Realtime SSE Event
      broadcastRealtimeEvent('customer.kyc.updated', {
        kycId: savedRecord?.id || kycId,
        customerId,
        referenceId,
        status: 'PENDING_VERIFICATION',
        timestamp: new Date().toISOString()
      });

      sendJson(res, 201, {
        success: true,
        message: 'KYC submitted successfully and is pending administrative review.',
        data: {
          id: savedRecord?.id || kycId,
          reference_id: referenceId,
          legal_name: legal_name.trim(),
          pan_masked: maskedPan,
          aadhaar_masked: maskedAadhaar,
          status: 'PENDING_VERIFICATION',
          submitted_at: new Date().toISOString()
        }
      });
      return true;
    } catch (err: any) {
      console.error('[KYC Submit Error]:', err);
      sendJson(res, 500, { error: 'Database Error', message: err.message || 'Failed to submit KYC verification' });
      return true;
    }
  }

  // 1b. POST /api/v1/kyc/document-signed-url - Issue short-lived signed URL for authorized users
  if (pathname === '/api/v1/kyc/document-signed-url' && req.method === 'POST') {
    if (!user) {
      sendJson(res, 401, { error: 'Authentication required' });
      return true;
    }

    const { kyc_id, file_path } = (req as any).body || {};
    if (!kyc_id) {
      sendJson(res, 400, { error: 'kyc_id is required' });
      return true;
    }

    try {
      const records = await queryDb(
        `SELECT id, customer_id, user_id, document_url FROM customer_kyc WHERE (id::text = $1 OR reference_id = $1) LIMIT 1`,
        [kyc_id]
      );

      if (!records || records.length === 0) {
        sendJson(res, 404, { error: 'KYC record not found' });
        return true;
      }

      const record = records[0];
      const isOwner = record.user_id === user.id || record.customer_id === user.id;
      const canReview = hasPermission(auth.role, 'kyc.review') || isStaff;

      if (!isOwner && !canReview) {
        sendJson(res, 403, { error: 'Forbidden: You do not have permission to access this KYC document.' });
        return true;
      }

      const targetPath = file_path || record.document_url || `kyc/${record.id}/document.pdf`;
      const cleanPath = targetPath.startsWith('http') ? (targetPath.split('/kyc-documents/')[1] || targetPath) : targetPath;

      let signedUrl = targetPath;
      if (supabaseAdmin && isSupabaseConfigured()) {
        try {
          const { data: signData, error: signErr } = await supabaseAdmin.storage
            .from('kyc-documents')
            .createSignedUrl(cleanPath, 300);
          if (!signErr && signData?.signedUrl) {
            signedUrl = signData.signedUrl;
          }
        } catch {
          // Fallback for local testing
        }
      }

      sendJson(res, 200, {
        success: true,
        signed_url: signedUrl,
        expires_in_seconds: 300,
        kyc_id: record.id
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: 'Failed to generate signed document URL', message: err.message });
      return true;
    }
  }

  // 2. GET /api/v1/kyc/status - Authenticated customer checks their KYC status
  if (pathname === '/api/v1/kyc/status' && req.method === 'GET') {
    if (!user) {
      if (process.env.NODE_ENV !== 'production' && req.headers['x-user-id']) {
        const devUserId = String(req.headers['x-user-id']);
        const customerId = toValidUuid(devUserId);
        try {
          const records = await queryDb(
            `SELECT id, customer_id, reference_id, legal_name, pan_masked, aadhaar_masked,
                    date_of_birth, document_type, document_url, status, rejection_reason,
                    action_required_notes, verified_at, submitted_at, created_at, updated_at
              FROM customer_kyc WHERE customer_id = $1 ORDER BY submitted_at DESC, created_at DESC LIMIT 1`,
            [customerId]
          );
          if (records && records.length > 0) {
            sendJson(res, 200, { status: records[0].status || 'PENDING', kyc: records[0] });
            return true;
          }
          sendJson(res, 200, { status: 'UNVERIFIED', kyc: null, message: 'No KYC submission record found.' });
          return true;
        } catch {
          sendJson(res, 200, { status: 'UNVERIFIED', kyc: null, message: 'Dev offline KYC mode.' });
          return true;
        }
      }
      sendJson(res, 401, { error: 'Authentication required' });
      return true;
    }

    const customerId = toValidUuid(user.id);
    try {
      const records = await queryDb(
        `SELECT id, customer_id, reference_id, legal_name, pan_masked, aadhaar_masked,
                date_of_birth, document_type, document_url, status, rejection_reason,
                action_required_notes, verified_at, submitted_at, created_at, updated_at
          FROM customer_kyc WHERE customer_id = $1 ORDER BY submitted_at DESC, created_at DESC LIMIT 1`,
        [customerId]
      );

      if (!records || records.length === 0) {
        // Check customers table for profile status
        const custRows = await queryDb(
          `SELECT kyc_status, full_name, pan_number_masked, aadhaar_number_masked FROM customers WHERE id = $1 OR user_id = $1 LIMIT 1`,
          [customerId]
        );
        const customerKycStatus = custRows && custRows.length > 0 ? (custRows[0].kyc_status || 'UNVERIFIED') : 'UNVERIFIED';

        sendJson(res, 200, {
          status: customerKycStatus,
          kyc: null,
          message: 'No KYC submission record found.'
        });
        return true;
      }

      sendJson(res, 200, {
        status: records[0].status || 'PENDING',
        kyc: records[0]
      });
      return true;
    } catch (err: any) {
      console.error('[KYC Status Error]:', err);
      sendJson(res, 500, { error: 'Failed to retrieve KYC status', message: err.message });
      return true;
    }
  }

  // 3. GET /api/v1/kyc/admin/list - Admin lists KYC submissions with stats, search & filters
  if (pathname === '/api/v1/kyc/admin/list' && req.method === 'GET') {
    if (!requirePermission(auth, res, 'kyc.review')) {
      return true;
    }

    const query = (req as any).query || {};
    const statusFilter = query.status || '';
    const searchQuery = query.search || '';

    try {
      const { stats, records } = await fetchAdminKycQueue(statusFilter, searchQuery);
      sendJson(res, 200, { stats, records });
      return true;
    } catch (err: any) {
      console.error('[KYC Admin List Fatal Error]:', {
        route: pathname,
        method: req.method,
        error: err?.message,
        code: err?.code,
        userId: auth.user?.id
      });
      sendJson(res, 500, {
        error: 'Failed to retrieve KYC queue',
        message: err?.message || 'Database error occurred while retrieving KYC records'
      });
      return true;
    }
  }

  // 4. GET /api/v1/kyc/admin/:id - Get specific submission details
  if (pathname.startsWith('/api/v1/kyc/admin/') && req.method === 'GET') {
    if (!requirePermission(auth, res, 'kyc.review')) {
      return true;
    }

    const kycId = pathname.replace('/api/v1/kyc/admin/', '');
    try {
      let record: any = null;
      let auditRows: any[] = [];

      // 1. Try PostgreSQL pool
      const pool = getDbPool();
      if (pool) {
        try {
          const records = await queryDb(
            `SELECT k.*, c.customer_code, c.email as customer_email, c.phone as customer_phone
             FROM customer_kyc k
             LEFT JOIN customers c ON k.customer_id = c.id
             WHERE (k.id::text = $1 OR COALESCE(k.reference_id, k.kyc_reference, '') = $1) LIMIT 1`,
            [kycId]
          );
          if (records && records.length > 0) {
            record = mapDbKycRecord(records[0]);
            auditRows = await queryDb(
              `SELECT * FROM customer_kyc_audit WHERE kyc_id = $1 ORDER BY created_at ASC`,
              [record.id]
            );
          }
        } catch (pgErr: any) {
          console.warn('[KYC Detail] Postgres query failed, trying Supabase REST:', pgErr?.message);
        }
      }

      // 2. Try Supabase REST Client
      if (!record && supabaseAdmin && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabaseAdmin
            .from('customer_kyc')
            .select('*, customers(customer_code, email, phone)')
            .or(`id.eq.${kycId},reference_id.eq.${kycId}`)
            .maybeSingle();

          if (!error && data) {
            record = mapDbKycRecord(data);
            const { data: audits } = await supabaseAdmin
              .from('customer_kyc_audit')
              .select('*')
              .eq('kyc_id', record.id)
              .order('created_at', { ascending: true });
            auditRows = audits || [];
          }
        } catch {
          // ignore
        }
      }

      // 3. Fallback memory store
      if (!record) {
        const memMatch = (memoryStore.customer_kyc || []).find((k: any) => k.id === kycId || k.reference_id === kycId);
        if (memMatch) {
          record = mapDbKycRecord(memMatch);
          auditRows = (memoryStore.customer_kyc_audit || []).filter((a: any) => a.kyc_id === record.id);
        }
      }

      if (!record) {
        sendJson(res, 404, { error: 'KYC submission not found' });
        return true;
      }

      sendJson(res, 200, {
        kyc: record,
        audit: auditRows || []
      });
      return true;
    } catch (err: any) {
      console.error('[KYC Detail Error]:', err);
      sendJson(res, 500, { error: 'Failed to retrieve record', message: err.message });
      return true;
    }
  }

  // 5. POST /api/v1/kyc/admin/start-review - Admin marks submission as UNDER_REVIEW
  if (pathname === '/api/v1/kyc/admin/start-review' && req.method === 'POST') {
    if (!requirePermission(auth, res, 'kyc.review')) {
      return true;
    }

    const { kyc_id } = (req as any).body || {};
    if (!kyc_id) {
      sendJson(res, 400, { error: 'Missing kyc_id' });
      return true;
    }

    try {
      const records = await queryDb(`SELECT * FROM customer_kyc WHERE (id::text = $1 OR reference_id = $1) LIMIT 1`, [kyc_id]);
      if (!records || records.length === 0) {
        sendJson(res, 404, { error: 'Record not found' });
        return true;
      }

      const current = records[0];
      const reviewerName = user.email || 'Compliance Officer';

      await queryDb(
        `UPDATE customer_kyc SET status = 'UNDER_REVIEW', reviewer_id = $1, reviewer_name = $2, updated_at = NOW() WHERE id = $3`,
        [user.id, reviewerName, current.id]
      );

      await queryDb(
        `INSERT INTO customer_kyc_audit (id, kyc_id, customer_id, from_status, to_status, changed_by_user_id, changed_by_name, change_reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [crypto.randomUUID(), current.id, current.customer_id, current.status, 'UNDER_REVIEW', user.id, reviewerName, 'Admin initiated compliance review']
      );

      broadcastRealtimeEvent('customer.kyc.updated', {
        kycId: kyc_id,
        customerId: current.customer_id,
        status: 'UNDER_REVIEW',
        reviewerName,
        timestamp: new Date().toISOString()
      });

      sendJson(res, 200, { success: true, status: 'UNDER_REVIEW' });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: 'Failed to start review', message: err.message });
      return true;
    }
  }

  // 6. POST /api/v1/kyc/admin/approve - Admin approves KYC
  if (pathname === '/api/v1/kyc/admin/approve' && req.method === 'POST') {
    if (!user || !isStaff) {
      sendJson(res, 403, { error: 'Forbidden', message: 'Admin or Compliance role required.' });
      return true;
    }

    const { kyc_id, notes } = (req as any).body || {};
    if (!kyc_id) {
      sendJson(res, 400, { error: 'Missing kyc_id' });
      return true;
    }

    try {
      const records = await queryDb(`SELECT * FROM customer_kyc WHERE (id::text = $1 OR reference_id = $1) LIMIT 1`, [kyc_id]);
      if (!records || records.length === 0) {
        sendJson(res, 404, { error: 'Record not found' });
        return true;
      }

      const current = records[0];
      const reviewerName = user.email || 'Compliance Officer';

      await queryDb(
        `UPDATE customer_kyc SET
           status = 'VERIFIED',
           verified_at = NOW(),
           reviewer_id = $1,
           reviewer_name = $2,
           rejection_reason = NULL,
           action_required_notes = NULL,
           updated_at = NOW()
         WHERE id = $3`,
        [user.id, reviewerName, current.id]
      );

      // Log in audit table
      await queryDb(
        `INSERT INTO customer_kyc_audit (id, kyc_id, customer_id, from_status, to_status, changed_by_user_id, changed_by_name, change_reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [crypto.randomUUID(), current.id, current.customer_id, current.status, 'VERIFIED', user.id, reviewerName, notes || 'Approved by compliance officer']
      );

      // Update customers table
      try {
        await queryDb(
          `UPDATE customers 
           SET kyc_status = 'VERIFIED', kyc_verified_at = NOW(), kyc_verified_by = $1, updated_at = NOW() 
           WHERE id = $2 OR user_id = $2`,
          [reviewerName, current.customer_id]
        );
      } catch (cErr: any) {
        console.error('[KYC Approve] Failed to update customer kyc_status in PostgreSQL:', cErr);
        throw cErr;
      }

      // Security audit log
      await logSecurityAuditEvent({
        action: 'kyc.approved',
        actorId: user.id,
        actorEmail: user.email,
        actorRole: (user as any).role || 'staff',
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '',
        userAgent: req.headers['user-agent'] as string,
        targetResource: 'customer_kyc',
        targetId: current.id,
        status: 'SUCCESS',
        details: { customerId: current.customer_id, referenceId: current.reference_id, notes }
      });

      // Customer notification
      await createAndDispatchNotification({
        recipient_id: current.customer_id,
        recipient_role: 'customer',
        event_type: 'kyc.verified',
        category: 'security',
        severity: 'success',
        title: 'KYC Verification Approved',
        message: `Congratulations! Your identity verification has been approved. You are now a Verified Patron (${current.reference_id}).`,
        related_entity_type: 'customer_kyc',
        related_entity_id: kyc_id,
        destination_route: '/dashboard'
      });

      // Broadcast Realtime SSE Event
      broadcastRealtimeEvent('customer.kyc.updated', {
        kycId: kyc_id,
        customerId: current.customer_id,
        referenceId: current.reference_id,
        status: 'VERIFIED',
        verifiedAt: new Date().toISOString(),
        reviewerName,
        timestamp: new Date().toISOString()
      });

      sendJson(res, 200, {
        success: true,
        message: 'KYC approved successfully. Customer status updated to Verified Patron.',
        status: 'VERIFIED'
      });
      return true;
    } catch (err: any) {
      console.error('[KYC Approve Error]:', err);
      sendJson(res, 500, { error: 'Failed to approve KYC', message: err.message });
      return true;
    }
  }

  // 7. POST /api/v1/kyc/admin/reject - Admin rejects KYC with mandatory reason
  if (pathname === '/api/v1/kyc/admin/reject' && req.method === 'POST') {
    if (!user || !isStaff) {
      sendJson(res, 403, { error: 'Forbidden', message: 'Admin or Compliance role required.' });
      return true;
    }

    const { kyc_id, reason } = (req as any).body || {};
    if (!kyc_id) {
      sendJson(res, 400, { error: 'Missing kyc_id' });
      return true;
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      sendJson(res, 400, {
        error: 'Mandatory Rejection Reason',
        message: 'A clear explanation of why the KYC was rejected must be provided (at least 5 characters).'
      });
      return true;
    }

    try {
      const records = await queryDb(`SELECT * FROM customer_kyc WHERE (id::text = $1 OR reference_id = $1) LIMIT 1`, [kyc_id]);
      if (!records || records.length === 0) {
        sendJson(res, 404, { error: 'Record not found' });
        return true;
      }

      const current = records[0];
      const reviewerName = user.email || 'Compliance Officer';

      await queryDb(
        `UPDATE customer_kyc SET
           status = 'REJECTED',
           rejection_reason = $1,
           reviewer_id = $2,
           reviewer_name = $3,
           updated_at = NOW()
         WHERE id = $4`,
        [reason.trim(), user.id, reviewerName, current.id]
      );

      // Audit trail
      await queryDb(
        `INSERT INTO customer_kyc_audit (id, kyc_id, customer_id, from_status, to_status, changed_by_user_id, changed_by_name, change_reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [crypto.randomUUID(), current.id, current.customer_id, current.status, 'REJECTED', user.id, reviewerName, `Rejection: ${reason.trim()}`]
      );

      // Update customers table
      try {
        await queryDb(
          `UPDATE customers 
           SET kyc_status = 'REJECTED', kyc_rejection_reason = $1, updated_at = NOW() 
           WHERE id = $2 OR user_id = $2`,
          [reason.trim(), current.customer_id]
        );
      } catch (cErr: any) {
        console.error('[KYC Reject] Failed to update customer kyc_status in PostgreSQL:', cErr);
        throw cErr;
      }

      // Security audit log
      await logSecurityAuditEvent({
        action: 'kyc.rejected',
        actorId: user.id,
        actorEmail: user.email,
        actorRole: (user as any).role || 'staff',
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '',
        userAgent: req.headers['user-agent'] as string,
        targetResource: 'customer_kyc',
        targetId: current.id,
        status: 'SUCCESS',
        details: { customerId: current.customer_id, referenceId: current.reference_id, reason }
      });

      // Customer notification
      await createAndDispatchNotification({
        recipient_id: current.customer_id,
        recipient_role: 'customer',
        event_type: 'kyc.rejected',
        category: 'security',
        severity: 'error',
        title: 'KYC Verification Rejected',
        message: `Your identity verification was rejected: ${reason.trim()}. You may update and resubmit your details.`,
        related_entity_type: 'customer_kyc',
        related_entity_id: kyc_id,
        destination_route: '/dashboard'
      });

      // Broadcast Realtime SSE Event
      broadcastRealtimeEvent('customer.kyc.updated', {
        kycId: kyc_id,
        customerId: current.customer_id,
        referenceId: current.reference_id,
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        reviewerName,
        timestamp: new Date().toISOString()
      });

      sendJson(res, 200, {
        success: true,
        message: 'KYC marked as rejected. Customer notified.',
        status: 'REJECTED'
      });
      return true;
    } catch (err: any) {
      console.error('[KYC Reject Error]:', err);
      sendJson(res, 500, { error: 'Failed to reject KYC', message: err.message });
      return true;
    }
  }

  // 8. POST /api/v1/kyc/admin/request-info - Admin requests additional info / action required
  if (pathname === '/api/v1/kyc/admin/request-info' && req.method === 'POST') {
    if (!user || !isStaff) {
      sendJson(res, 403, { error: 'Forbidden', message: 'Admin or Compliance role required.' });
      return true;
    }

    const { kyc_id, notes } = (req as any).body || {};
    if (!kyc_id) {
      sendJson(res, 400, { error: 'Missing kyc_id' });
      return true;
    }

    if (!notes || typeof notes !== 'string' || notes.trim().length < 5) {
      sendJson(res, 400, {
        error: 'Mandatory Instructions',
        message: 'Clear instructions regarding the missing or corrected information required must be provided.'
      });
      return true;
    }

    try {
      const records = await queryDb(`SELECT * FROM customer_kyc WHERE (id::text = $1 OR reference_id = $1) LIMIT 1`, [kyc_id]);
      if (!records || records.length === 0) {
        sendJson(res, 404, { error: 'Record not found' });
        return true;
      }

      const current = records[0];
      const reviewerName = user.email || 'Compliance Officer';

      await queryDb(
        `UPDATE customer_kyc SET
           status = 'ACTION_REQUIRED',
           action_required_notes = $1,
           reviewer_id = $2,
           reviewer_name = $3,
           updated_at = NOW()
         WHERE id = $4`,
        [notes.trim(), user.id, reviewerName, current.id]
      );

      // Audit trail
      await queryDb(
        `INSERT INTO customer_kyc_audit (id, kyc_id, customer_id, from_status, to_status, changed_by_user_id, changed_by_name, change_reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [crypto.randomUUID(), current.id, current.customer_id, current.status, 'ACTION_REQUIRED', user.id, reviewerName, `Action Required: ${notes.trim()}`]
      );

      // Security audit log
      await logSecurityAuditEvent({
        action: 'kyc.action_required',
        actorId: user.id,
        actorEmail: user.email,
        actorRole: (user as any).role || 'staff',
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '',
        userAgent: req.headers['user-agent'] as string,
        targetResource: 'customer_kyc',
        targetId: current.id,
        status: 'SUCCESS',
        details: { customerId: current.customer_id, referenceId: current.reference_id, notes }
      });

      // Customer notification
      await createAndDispatchNotification({
        recipient_id: current.customer_id,
        recipient_role: 'customer',
        event_type: 'kyc.action_required',
        category: 'security',
        severity: 'warning',
        title: 'Action Required: KYC Verification',
        message: `Action required for your KYC verification: ${notes.trim()}. Please update your information.`,
        related_entity_type: 'customer_kyc',
        related_entity_id: kyc_id,
        destination_route: '/dashboard'
      });

      // Broadcast Realtime SSE Event
      broadcastRealtimeEvent('customer.kyc.updated', {
        kycId: kyc_id,
        customerId: current.customer_id,
        referenceId: current.reference_id,
        status: 'ACTION_REQUIRED',
        actionRequiredNotes: notes.trim(),
        reviewerName,
        timestamp: new Date().toISOString()
      });

      sendJson(res, 200, {
        success: true,
        message: 'Status updated to Action Required. Customer notified.',
        status: 'ACTION_REQUIRED'
      });
      return true;
    } catch (err: any) {
      console.error('[KYC Request Info Error]:', err);
      sendJson(res, 500, { error: 'Failed to request info', message: err.message });
      return true;
    }
  }

  // 9. POST /api/v1/kyc/resubmit - Customer resubmits corrected details
  if (pathname === '/api/v1/kyc/resubmit' && req.method === 'POST') {
    if (!user) {
      sendJson(res, 401, { error: 'Authentication required' });
      return true;
    }

    const customerId = toValidUuid(user.id);
    const body = (req as any).body || {};
    const {
      legal_name,
      pan_number,
      aadhaar_number,
      date_of_birth,
      document_type,
      document_url,
      consent_given
    } = body;

    // Check existing record
    try {
      const records = await queryDb(
        `SELECT * FROM customer_kyc WHERE customer_id = $1 LIMIT 1`,
        [customerId]
      );

      if (!records || records.length === 0) {
        sendJson(res, 404, { error: 'No previous KYC submission found to resubmit' });
        return true;
      }

      const current = records[0];
      if (current.status !== 'REJECTED' && current.status !== 'ACTION_REQUIRED') {
        sendJson(res, 400, {
          error: 'Invalid Operation',
          message: `Cannot resubmit KYC when current status is ${current.status}.`
        });
        return true;
      }

      if (!consent_given) {
        sendJson(res, 400, { error: 'Consent is required' });
        return true;
      }

      // Validations
      if (!legal_name || legal_name.trim().length < 3) {
        sendJson(res, 400, { error: 'Full legal name must be at least 3 characters.' });
        return true;
      }

      const panResult = validatePan(pan_number);
      if (!panResult.valid) {
        sendJson(res, 400, { error: panResult.error });
        return true;
      }

      const aadhaarResult = validateAadhaar(aadhaar_number);
      if (!aadhaarResult.valid) {
        sendJson(res, 400, { error: aadhaarResult.error });
        return true;
      }

      const dobResult = validateDateOfBirth(date_of_birth);
      if (!dobResult.valid) {
        sendJson(res, 400, { error: dobResult.error });
        return true;
      }

      const maskedPan = maskPan(pan_number);
      const maskedAadhaar = maskAadhaar(aadhaar_number);
      const panHash = hashSensitiveIdentifier(pan_number);
      const aadhaarHash = hashSensitiveIdentifier(aadhaar_number);

      await queryDb(
        `UPDATE customer_kyc SET
           legal_name = $1,
           pan_masked = $2,
           pan_hash = $3,
           aadhaar_masked = $4,
           aadhaar_hash = $5,
           date_of_birth = $6,
           document_type = $7,
           document_url = $8,
           status = 'PENDING_VERIFICATION',
           rejection_reason = NULL,
           action_required_notes = NULL,
           submitted_at = NOW(),
           updated_at = NOW()
         WHERE id = $9`,
        [
          legal_name.trim(),
          maskedPan,
          panHash,
          maskedAadhaar,
          aadhaarHash,
          date_of_birth,
          document_type || current.document_type,
          document_url || current.document_url,
          current.id
        ]
      );

      // Log audit
      await queryDb(
        `INSERT INTO customer_kyc_audit (id, kyc_id, customer_id, from_status, to_status, changed_by_user_id, changed_by_name, change_reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [crypto.randomUUID(), current.id, customerId, current.status, 'PENDING_VERIFICATION', user.id, legal_name.trim(), 'Customer corrected and resubmitted KYC details']
      );

      // Update customers table
      try {
        await queryDb(
          `UPDATE customers 
           SET kyc_status = 'PENDING', full_name = $1, pan_number_masked = $2, aadhaar_number_masked = $3, updated_at = NOW() 
           WHERE id = $4 OR user_id = $4`,
          [legal_name.trim(), maskedPan, maskedAadhaar, customerId]
        );
      } catch (cErr: any) {
        console.error('[KYC Resubmit] Failed to update customer kyc_status in PostgreSQL:', cErr);
        throw cErr;
      }

      // Notifications
      await createAndDispatchNotification({
        recipient_id: user.id,
        recipient_role: 'customer',
        event_type: 'kyc.resubmitted',
        category: 'security',
        severity: 'info',
        title: 'KYC Resubmitted',
        message: `Your updated verification details (${current.reference_id}) have been resubmitted for compliance review.`,
        related_entity_type: 'customer_kyc',
        related_entity_id: current.id,
        destination_route: '/dashboard'
      });

      broadcastRealtimeEvent('customer.kyc.updated', {
        kycId: current.id,
        customerId,
        referenceId: current.reference_id,
        status: 'PENDING_VERIFICATION',
        timestamp: new Date().toISOString()
      });

      sendJson(res, 200, {
        success: true,
        message: 'Corrected KYC submitted successfully. Status updated to Pending Verification.',
        data: {
          id: current.id,
          reference_id: current.reference_id,
          status: 'PENDING_VERIFICATION'
        }
      });
      return true;
    } catch (err: any) {
      console.error('[KYC Resubmit Error]:', err);
      sendJson(res, 500, { error: 'Failed to resubmit KYC', message: err.message });
      return true;
    }
  }

  // 10. GET /api/v1/kyc/audit/:id - Fetch audit trail for a KYC record
  if (pathname.startsWith('/api/v1/kyc/audit/') && req.method === 'GET') {
    if (!user) {
      sendJson(res, 401, { error: 'Authentication required' });
      return true;
    }

    const targetKycId = pathname.replace('/api/v1/kyc/audit/', '');
    try {
      const records = await queryDb(
        `SELECT customer_id FROM customer_kyc WHERE id = $1 LIMIT 1`,
        [targetKycId]
      );

      if (!records || records.length === 0) {
        sendJson(res, 404, { error: 'KYC record not found' });
        return true;
      }

      // Only staff or the customer who owns this record can view the audit trail
      const customerId = toValidUuid(user.id);
      if (!isStaff && records[0].customer_id !== customerId) {
        sendJson(res, 403, { error: 'Forbidden', message: 'You can only view your own audit trail.' });
        return true;
      }

      const auditRows = await queryDb(
        `SELECT * FROM customer_kyc_audit WHERE kyc_id = $1 ORDER BY created_at ASC`,
        [targetKycId]
      );

      sendJson(res, 200, { audit: auditRows || [] });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { error: 'Failed to retrieve audit trail', message: err.message });
      return true;
    }
  }

  return false;
}
