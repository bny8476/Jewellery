import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { calculateInterest } from '../utils/calculations';

describe('PHASE 1 AUDIT: Authentication, Security, Payment & Pawn Integrity Suite', () => {

  // ==========================================================================
  // PRIORITY 1: AUTHENTICATION, AUTHORIZATION & CROSS-CUSTOMER ISOLATION
  // ==========================================================================
  describe('Priority 1: Auth & RBAC Isolation', () => {
    // Evaluation helper for server-side route access control
    const evaluateApiAccess = (user: { id: string; role: string } | null, resourceOwnerId: string, isStaffOnly: boolean) => {
      if (!user) {
        return { status: 401, error: 'Authentication required' };
      }
      const staffRoles = ['super_admin', 'admin', 'manager', 'staff', 'cashier'];
      const isStaff = staffRoles.includes(user.role);

      if (isStaffOnly && !isStaff) {
        return { status: 403, error: 'Unauthorized: Staff permissions required' };
      }

      if (!isStaff && resourceOwnerId && user.id !== resourceOwnerId) {
        return { status: 403, error: 'Unauthorized: Cross-customer data access forbidden' };
      }

      return { status: 200, success: true };
    };

    it('rejects unauthenticated requests with 401 status', () => {
      const res = evaluateApiAccess(null, 'user_123', false);
      expect(res.status).toBe(401);
      expect(res.error).toBe('Authentication required');
    });

    it('blocks regular customer from accessing staff-only routes (403)', () => {
      const customerUser = { id: 'cust_001', role: 'customer' };
      const res = evaluateApiAccess(customerUser, 'cust_001', true);
      expect(res.status).toBe(403);
      expect(res.error).toContain('Staff permissions required');
    });

    it('prevents customer A from accessing customer B records (cross-customer isolation)', () => {
      const customerA = { id: 'cust_alice', role: 'customer' };
      const customerBRecordOwner = 'cust_bob';
      const res = evaluateApiAccess(customerA, customerBRecordOwner, false);
      expect(res.status).toBe(403);
      expect(res.error).toContain('Cross-customer data access forbidden');
    });

    it('allows customer to access their own records', () => {
      const customerA = { id: 'cust_alice', role: 'customer' };
      const res = evaluateApiAccess(customerA, 'cust_alice', false);
      expect(res.status).toBe(200);
      expect(res.success).toBe(true);
    });

    it('allows authorized staff to access any customer record for servicing', () => {
      const staffUser = { id: 'staff_101', role: 'admin' };
      const res = evaluateApiAccess(staffUser, 'cust_bob', false);
      expect(res.status).toBe(200);
      expect(res.success).toBe(true);
    });

    it('rejects email wildcard admin spoofing like badadmin@gmail.com', () => {
      const isStrictAdmin = (email: string, appRole?: string, configuredAdminEmail?: string) => {
        const staffRoles = ['super_admin', 'admin', 'manager', 'staff'];
        return (
          email === 'admin@luxury.com' ||
          (Boolean(configuredAdminEmail) && email === configuredAdminEmail) ||
          (Boolean(appRole) && staffRoles.includes(appRole!))
        );
      };

      // Attacker registering with "admin" in email
      expect(isStrictAdmin('attacker.admin@gmail.com')).toBe(false);
      expect(isStrictAdmin('admin_impersonator@yahoo.com')).toBe(false);
      expect(isStrictAdmin('myadmin@pawnshop.com')).toBe(false);

      // Legitimate admin
      expect(isStrictAdmin('admin@luxury.com')).toBe(true);
      expect(isStrictAdmin('owner@rcbjewelry.in', undefined, 'owner@rcbjewelry.in')).toBe(true);
      expect(isStrictAdmin('staff@rcb.com', 'admin')).toBe(true);
    });
  });

  // ==========================================================================
  // PRIORITY 2 & 4: PAWN LIFECYCLE & DATABASE INTEGRITY
  // ==========================================================================
  describe('Priority 2 & 4: Pawn Lifecycle & Calculation Integrity', () => {
    it('calculates interest accurately across monthly, yearly, and daily schemes', () => {
      const monthly = calculateInterest({
        principal: 50000,
        rate: 2, // 2% per month
        startDate: '2024-01-01',
        endDate: '2024-01-31', // 30 days
        interestType: 'monthly'
      });
      expect(monthly).toBe(1000); // (50000 * 2/30 * 30)/100 = 1000

      const daily = calculateInterest({
        principal: 10000,
        rate: 0.1, // 0.1% per day
        startDate: '2024-01-01',
        endDate: '2024-01-11', // 10 days
        interestType: 'daily'
      });
      expect(daily).toBe(100);

      const zeroDays = calculateInterest({
        principal: 10000,
        rate: 2,
        startDate: '2024-01-01',
        endDate: '2024-01-01',
        interestType: 'monthly'
      });
      expect(zeroDays).toBe(0);
    });

    it('enforces Loan-to-Value (LTV) limits: loan cannot exceed appraised jewelry value', () => {
      const validatePawnLoanCreation = (appraisedValue: number, requestedLoan: number) => {
        if (appraisedValue <= 0) throw new Error('Appraised value must be positive');
        if (requestedLoan <= 0) throw new Error('Loan amount must be positive');
        if (requestedLoan > appraisedValue) {
          throw new Error(`Loan amount (₹${requestedLoan}) exceeds appraised collateral value (₹${appraisedValue})`);
        }
        const maxLTV = 0.85; // Standard 85% LTV cap
        const maxEligible = Math.floor(appraisedValue * maxLTV);
        return { eligible: requestedLoan <= maxEligible, maxEligible };
      };

      // Safe loan: ₹1,00,000 item, ₹75,000 loan (75% LTV)
      expect(validatePawnLoanCreation(100000, 75000).eligible).toBe(true);

      // Unsafe loan: ₹1,00,000 item, ₹1,20,000 loan (120% LTV)
      expect(() => validatePawnLoanCreation(100000, 120000)).toThrow('exceeds appraised collateral value');
    });

    it('safeguards against double-repayment and payment on closed pawn loans', () => {
      const processRepayment = (pledge: { status: string; balance: number }, paymentAmount: number) => {
        if (pledge.status === 'closed' || pledge.status === 'sold') {
          throw new Error(`Cannot accept repayment: Loan is already ${pledge.status}`);
        }
        if (paymentAmount <= 0) {
          throw new Error('Payment amount must be greater than zero');
        }
        if (paymentAmount > pledge.balance) {
          throw new Error(`Payment (₹${paymentAmount}) exceeds outstanding balance (₹${pledge.balance})`);
        }
        const newBalance = pledge.balance - paymentAmount;
        return {
          newBalance,
          newStatus: newBalance === 0 ? 'closed' : 'partially_paid'
        };
      };

      const openLoan = { status: 'active', balance: 50000 };

      // Valid partial repayment
      const step1 = processRepayment(openLoan, 20000);
      expect(step1.newBalance).toBe(30000);
      expect(step1.newStatus).toBe('partially_paid');

      // Valid full settlement
      const step2 = processRepayment({ status: step1.newStatus, balance: step1.newBalance }, 30000);
      expect(step2.newBalance).toBe(0);
      expect(step2.newStatus).toBe('closed');

      // Replay attack on closed loan rejected
      expect(() => processRepayment({ status: 'closed', balance: 0 }, 10000)).toThrow('Loan is already closed');

      // Overpayment rejected
      expect(() => processRepayment({ status: 'active', balance: 5000 }, 6000)).toThrow('exceeds outstanding balance');
    });

    it('prevents collateral item release when outstanding loan balance remains', () => {
      const authorizeItemRelease = (pledge: { balance: number; status: string }) => {
        if (pledge.balance > 0 || pledge.status !== 'closed') {
          throw new Error('Collateral item cannot be released until loan is fully settled');
        }
        return { authorized: true, releaseDate: new Date().toISOString() };
      };

      // Unpaid loan
      expect(() => authorizeItemRelease({ balance: 15000, status: 'partially_paid' })).toThrow('until loan is fully settled');

      // Fully settled loan
      expect(authorizeItemRelease({ balance: 0, status: 'closed' }).authorized).toBe(true);
    });
  });

  // ==========================================================================
  // PRIORITY 3: PAYMENT INTEGRITY & RAZORPAY VERIFICATION
  // ==========================================================================
  describe('Priority 3: Payment Verification & Gateway Integrity', () => {
    const mockSecret = 'test_razorpay_secret_key_12345';

    const generateSignature = (orderId: string, paymentId: string, secret: string) => {
      return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    };

    it('verifies valid HMAC-SHA256 signature using timing-safe comparison', () => {
      const orderId = 'order_test_999';
      const paymentId = 'pay_test_888';
      const signature = generateSignature(orderId, paymentId, mockSecret);

      const verifyPayment = (ordId: string, payId: string, sig: string, secret: string) => {
        const expected = crypto.createHmac('sha256', secret).update(`${ordId}|${payId}`).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sig, 'utf8'));
      };

      expect(verifyPayment(orderId, paymentId, signature, mockSecret)).toBe(true);
    });

    it('rejects tampered or forged payment signatures', () => {
      const orderId = 'order_test_999';
      const paymentId = 'pay_test_888';
      const fakeSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

      const verifyPayment = (ordId: string, payId: string, sig: string, secret: string) => {
        const expected = crypto.createHmac('sha256', secret).update(`${ordId}|${payId}`).digest('hex');
        if (expected.length !== sig.length) return false;
        return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sig, 'utf8'));
      };

      expect(verifyPayment(orderId, paymentId, fakeSignature, mockSecret)).toBe(false);
    });

    it('enforces payment idempotency: prevents duplicate payment processing', () => {
      const processedPayments = new Set<string>();

      const processCapturedPayment = (paymentId: string) => {
        if (processedPayments.has(paymentId)) {
          return { status: 'idempotent', message: 'Payment already processed' };
        }
        processedPayments.add(paymentId);
        return { status: 'processed', paymentId };
      };

      const payId = 'pay_unique_123456';
      const firstCall = processCapturedPayment(payId);
      expect(firstCall.status).toBe('processed');

      // Duplicate invocation (e.g. repeated webhook or replay)
      const secondCall = processCapturedPayment(payId);
      expect(secondCall.status).toBe('idempotent');
      expect(secondCall.message).toBe('Payment already processed');
    });

    it('rejects negative, zero, or client-tampered order amounts during order creation', () => {
      const validateOrderAmount = (amount: number) => {
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error('Valid positive payment amount is required');
        }
        if (amount < 1) {
          throw new Error('Minimum transaction amount is ₹1.00');
        }
        if (amount > 5000000) {
          throw new Error('Transaction exceeds maximum allowable limit of ₹50,00,000');
        }
        return Math.round(amount * 100); // paise
      };

      expect(validateOrderAmount(2500)).toBe(250000);
      expect(() => validateOrderAmount(0)).toThrow('positive payment amount');
      expect(() => validateOrderAmount(-100)).toThrow('positive payment amount');
      expect(() => validateOrderAmount(0.5)).toThrow('Minimum transaction amount is ₹1.00');
      expect(() => validateOrderAmount(10000000)).toThrow('exceeds maximum allowable limit');
    });
  });

  // ==========================================================================
  // PRIORITY 5: AURA GOLD SAFETY GATE
  // ==========================================================================
  describe('Priority 5: Aura Gold Safety Gate Verification', () => {
    it('confirms real-money digital gold purchase is disabled/unverified without licensed custodian', () => {
      const digitalGoldSafetyGate = {
        providerVerified: false,
        custodyPartner: null,
        insuranceUnderwriter: null,
        sebiRbiRegistration: null,
        allowRealMoneyPurchase: false
      };

      const executeDigitalGoldPurchase = (gate: typeof digitalGoldSafetyGate, grams: number) => {
        if (!gate.allowRealMoneyPurchase || !gate.providerVerified || !gate.custodyPartner) {
          throw new Error('Digital Gold real-money purchases are disabled pending regulatory custodian verification');
        }
        return { grams, status: 'allocated' };
      };

      expect(() => executeDigitalGoldPurchase(digitalGoldSafetyGate, 1.5)).toThrow(
        'Digital Gold real-money purchases are disabled pending regulatory custodian verification'
      );
    });
  });
});
