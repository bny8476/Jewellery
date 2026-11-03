import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { IncomingMessage } from 'http';
import crypto from 'crypto';
import { authenticateRequest, ANON, hasPermission, requirePermission, type AuthContext } from './apiV1.ts';
import { validateStartupConfig } from '../db.ts';
import { logSecurityAuditEvent, getAuditLogs } from '../services/auditLogger.ts';
import { getClientIp } from '../middleware/rateLimiter.ts';
import { sendApiResponse } from '../utils/apiResponse.ts';
import verifyPaymentHandler from '../../api/verify-razorpay-payment.ts';
import createOrderHandler from '../../api/create-razorpay-order.ts';

// Set test environment secrets
beforeAll(() => {
  process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_123456';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_key_123456';
});

const mockPaymentFetch = vi.fn();

// Mock Razorpay SDK
vi.mock('razorpay', () => {
  return {
    default: class MockRazorpay {
      orders = {
        create: vi.fn(async (opts: any) => ({
          id: 'order_rzp_mock_123',
          amount: opts.amount,
          currency: opts.currency,
          receipt: opts.receipt
        }))
      };
      payments = {
        fetch: mockPaymentFetch
      };
    }
  };
});

// Partially mock db.ts to preserve memoryStore while stubbing supabaseAdmin
vi.mock('../db.ts', async (importOriginal) => {
  const actual = await importOriginal<any>();
  const mockUser = { id: 'test-user-uuid-1234', email: 'patron@example.com' };

  return {
    ...actual,
    supabaseAdmin: {
      auth: {
        getUser: vi.fn(async (token: string) => {
          if (token === 'valid-live-jwt-token') {
            return { data: { user: mockUser }, error: null };
          }
          return { data: { user: null }, error: new Error('Invalid or expired signature') };
        })
      },
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn((col: string, val: string) => ({
            eq: vi.fn((col2: string, val2: string) => ({
              maybeSingle: vi.fn(async () => {
                if (table === 'orders' && val === 'order-correct-123' && val2 === 'test-user-uuid-1234') {
                  return {
                    data: {
                      id: 'order-correct-123',
                      user_id: 'test-user-uuid-1234',
                      total_amount: 15000,
                      status: 'pending',
                      payment_status: 'unpaid',
                      razorpay_order_id: 'order_rzp_correct_456'
                    },
                    error: null
                  };
                }
                return { data: null, error: null };
              })
            })),
            maybeSingle: vi.fn(async () => {
              if (table === 'profiles') return { data: { role: 'customer' }, error: null };
              return { data: null, error: null };
            })
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null }))
          }))
        })),
        insert: vi.fn(async () => ({ error: null }))
      })),
      rpc: vi.fn(async (funcName: string, params: any) => {
        if (params.p_payment_id === 'pay_already_processed') {
          return { data: { success: true, idempotent: true, message: 'Payment was previously processed.' }, error: null };
        }
        return { data: { success: true, order_id: params.p_order_id }, error: null };
      })
    }
  };
});

describe('1. Authentication Security Tests', () => {
  it('a forged token returns anon', async () => {
    const req = {
      headers: {
        authorization: 'Bearer forged.tampered.token123'
      }
    } as unknown as IncomingMessage;

    const auth = await authenticateRequest(req);
    expect(auth.user).toBeNull();
    expect(auth.role).toBe('anon');
    expect(auth.isStaff).toBe(false);
  });

  it('unauthenticated request with forged x-user-id header returns anon', async () => {
    const req = {
      headers: {
        'x-user-id': 'admin-user-001',
        'x-user-email': 'admin@luxury.com'
      }
    } as unknown as IncomingMessage;

    const auth = await authenticateRequest(req);
    expect(auth).toEqual(ANON);
  });

  it('legacy test-token prefix returns anon without live Supabase verification', async () => {
    const req = {
      headers: {
        authorization: 'Bearer test-token-admin'
      }
    } as unknown as IncomingMessage;

    const auth = await authenticateRequest(req);
    expect(auth.user).toBeNull();
    expect(auth.role).toBe('anon');
  });
});

describe('2. Payment Flow Security Tests', () => {
  function createMockRes() {
    const res: any = {
      statusCode: 200,
      headers: {},
      body: null,
      setHeader(k: string, v: string) { res.headers[k] = v; },
      status(code: number) { res.statusCode = code; return res; },
      json(data: any) { res.body = data; return res; },
      end() { return res; }
    };
    return res;
  }

  it('rejects order creation without valid bearer authentication', async () => {
    const req: any = {
      method: 'POST',
      headers: {},
      body: { orderId: 'order-correct-123' }
    };
    const res = createMockRes();

    await createOrderHandler(req, res);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/Authentication required/i);
  });

  it('a payment for the wrong order is rejected with 400', async () => {
    const req: any = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-live-jwt-token'
      },
      body: {
        orderId: 'order-correct-123',
        razorpay_order_id: 'order_rzp_WRONG_999', // Mismatched order reference
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'dummy_sig'
      }
    };
    const res = createMockRes();

    await verifyPaymentHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.verified).toBe(false);
    expect(res.body.error).toMatch(/Order mismatch/i);
  });

  it('a forged or wrong signature length returns 400 instead of throwing an unhandled exception', async () => {
    const req: any = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-live-jwt-token'
      },
      body: {
        orderId: 'order-correct-123',
        razorpay_order_id: 'order_rzp_correct_456',
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'short' // Invalid length
      }
    };
    const res = createMockRes();

    await verifyPaymentHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.verified).toBe(false);
    expect(res.body.error).toMatch(/Invalid signature/i);
  });

  it('a wrong amount from gateway is rejected with 400', async () => {
    const orderId = 'order_rzp_correct_456';
    const paymentId = 'pay_wrong_amount_test';
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const validSignature = crypto.createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const req: any = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-live-jwt-token'
      },
      body: {
        orderId: 'order-correct-123',
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      }
    };
    const res = createMockRes();

    mockPaymentFetch.mockResolvedValueOnce({
      id: paymentId,
      order_id: orderId,
      amount: 100, // WRONG AMOUNT (₹1 instead of ₹15,000)
      currency: 'INR',
      status: 'captured'
    });

    await verifyPaymentHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.verified).toBe(false);
    expect(res.body.error).toMatch(/mismatch on status, amount, currency, or order ID/i);
  });

  it('a replayed payment is handled idempotently without re-execution', async () => {
    const orderId = 'order_rzp_correct_456';
    const paymentId = 'pay_already_processed';
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const validSignature = crypto.createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const req: any = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-live-jwt-token'
      },
      body: {
        orderId: 'order-correct-123',
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      }
    };
    const res = createMockRes();

    mockPaymentFetch.mockResolvedValueOnce({
      id: paymentId,
      order_id: orderId,
      amount: 1500000, // ₹15,000 in paise
      currency: 'INR',
      status: 'captured'
    });

    await verifyPaymentHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body.paymentId).toBe(paymentId);
  });
});

describe('3. Phase 1 (P0) Production Hardening Tests', () => {
  it('P0-1: validateStartupConfig fails closed and throws fatal error in production if DB settings missing', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const originalDb = process.env.DATABASE_URL;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.DATABASE_URL;

      expect(() => validateStartupConfig()).toThrow(/DB FATAL STARTUP CONFIGURATION ERROR/i);
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalKey) process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
      if (originalDb) process.env.DATABASE_URL = originalDb;
    }
  });

  it('P0-2: requirePermission enforces granular server-side RBAC across staff roles', () => {
    const mockRes = () => {
      const res: any = {
        statusCode: 200,
        headers: {},
        body: null,
        setHeader(k: string, v: string) { res.headers[k] = v; },
        end(data: string) { res.body = JSON.parse(data); return res; }
      };
      return res;
    };

    // Customer has no staff permissions
    const customerAuth: AuthContext = {
      user: { id: 'cust-1' },
      role: 'customer',
      isStaff: false,
      permissions: new Set(),
      hasPermission: () => false
    };

    const res1 = mockRes();
    expect(requirePermission(customerAuth, res1, 'kyc.review')).toBe(false);
    expect(res1.statusCode).toBe(403);

    // Sales staff has orders.read, but NOT kyc.review or inventory.update
    expect(hasPermission('sales_staff', 'orders.read')).toBe(true);
    expect(hasPermission('sales_staff', 'kyc.review')).toBe(false);
    expect(hasPermission('sales_staff', 'inventory.update')).toBe(false);

    // Super Admin has all permissions
    expect(hasPermission('super_admin', 'inventory.update')).toBe(true);
    expect(hasPermission('super_admin', 'kyc.review')).toBe(true);
    expect(hasPermission('super_admin', 'reports.financial')).toBe(true);
  });

  it('P0-3: verifyPaymentHandler rejects authorized payment when gateway capture is not confirmed', async () => {
    const orderId = 'order_rzp_correct_456';
    const paymentId = 'pay_authorized_only_123';
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const validSignature = crypto.createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const req: any = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-live-jwt-token'
      },
      body: {
        orderId: 'order-correct-123',
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      }
    };
    const res: any = {
      statusCode: 200,
      headers: {},
      body: null,
      setHeader(k: string, v: string) { res.headers[k] = v; },
      status(code: number) { res.statusCode = code; return res; },
      json(data: any) { res.body = data; return res; },
      end() { return res; }
    };

    // Gateway reports status is only 'authorized', not captured, and capture throws or fails
    mockPaymentFetch.mockResolvedValueOnce({
      id: paymentId,
      order_id: orderId,
      amount: 1500000,
      currency: 'INR',
      status: 'authorized'
    });

    await verifyPaymentHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.verified).toBe(false);
  });
});

describe('4. Phase 2 (P1) Backend & Database Remediation Tests', () => {
  it('P1-1: logSecurityAuditEvent records structured tamper-evident audit logs and stores in queryable log', async () => {
    const entry = await logSecurityAuditEvent({
      actor_id: 'test-admin-uuid',
      actor_email: 'compliance@yazhini.in',
      actor_role: 'super_admin',
      action: 'pawn.approve_loan',
      entity_type: 'pledge',
      entity_id: 'pledge-rcb-1008',
      previous_state: { status: 'open' },
      new_state: { status: 'approved', approved_amount: 500000 },
      status: 'SUCCESS',
      metadata: { ltv: 75, interest_rate: 1.5 }
    });

    expect(entry.id).toBeDefined();
    expect(entry.action).toBe('pawn.approve_loan');
    expect(entry.created_at).toBeDefined();

    const retrieved = await getAuditLogs({ action: 'pawn.approve_loan' });
    expect(retrieved.length).toBeGreaterThan(0);
    expect(retrieved[0].actor_role).toBe('super_admin');
  });

  it('P1-2: getClientIp respects trusted proxy configuration and ignores spoofed headers when untrusted', () => {
    const originalTrusted = process.env.TRUSTED_PROXY;
    const originalNodeEnv = process.env.NODE_ENV;

    try {
      // 1. Untrusted environment (e.g. dev without explicit trusted proxy)
      process.env.TRUSTED_PROXY = 'false';
      process.env.NODE_ENV = 'development';

      const spoofedReq: any = {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
        socket: { remoteAddress: '192.168.1.50' }
      };

      // When untrusted, x-forwarded-for is ignored to prevent spoofing
      expect(getClientIp(spoofedReq)).toBe('192.168.1.50');

      // 2. Trusted reverse proxy environment
      process.env.TRUSTED_PROXY = 'true';
      expect(getClientIp(spoofedReq)).toBe('1.2.3.4');
    } finally {
      process.env.TRUSTED_PROXY = originalTrusted;
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('P1-3: sendApiResponse generates standardized envelope with requestId and timestamp', () => {
    const res: any = {
      statusCode: 200,
      headers: {},
      body: null,
      setHeader(k: string, v: string) { res.headers[k] = v; },
      end(data: string) { res.body = JSON.parse(data); return res; }
    };

    sendApiResponse(res, 200, {
      success: true,
      data: { goldRate: 7250 },
      requestId: 'req-corr-uuid-999'
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['X-Request-Id']).toBe('req-corr-uuid-999');
    expect(res.body.success).toBe(true);
    expect(res.body.data.goldRate).toBe(7250);
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.requestId).toBe('req-corr-uuid-999');
  });
});
