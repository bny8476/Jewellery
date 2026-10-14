import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getCustomers, getCustomerById, getCustomerStats, 
  createCustomer, updateCustomer, checkDuplicateCustomer,
  updateKycStatus, adjustLoyaltyPoints, recordCustomerPayment,
  exportCustomersCSV, importCustomersCSV, resetCustomerMemoryStorage 
} from './customerService';

describe('Customer CRM Service', () => {
  beforeEach(() => {
    resetCustomerMemoryStorage();
  });

  it('loads seeded customers with valid stats', async () => {
    const customers = await getCustomers();
    expect(customers.length).toBeGreaterThanOrEqual(6);

    const stats = await getCustomerStats();
    expect(stats.total_customers).toBe(customers.length);
    expect(stats.active_customers).toBeGreaterThan(0);
    expect(stats.vip_loyalty_customers).toBeGreaterThan(0);
  });

  it('detects duplicate customer by phone number', async () => {
    // 9840123456 belongs to seed customer Rajeshwari Sundaram
    const dup = checkDuplicateCustomer('9840123456');
    expect(dup.isDuplicate).toBe(true);
    expect(dup.matchedField).toBe('Phone Number');
    expect(dup.existingCustomer?.full_name).toBe('Rajeshwari Sundaram');

    const noDup = checkDuplicateCustomer('9999900000');
    expect(noDup.isDuplicate).toBe(false);
  });

  it('creates a new customer and generates unique code', async () => {
    const created = await createCustomer({
      full_name: 'Ananya Deshmukh',
      phone: '9123456789',
      address: '104, TTK Road, Alwarpet',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600018',
      email: 'ananya.deshmukh@gmail.com',
      id_proof_type: 'pan',
      id_proof_number: 'ABCDE9999Z'
    });

    expect(created.id).toBeDefined();
    expect(created.customer_code).toContain('RCB-CUST-');
    expect(created.full_name).toBe('Ananya Deshmukh');
    expect(created.loyalty_points).toBe(50); // Signup welcome bonus

    const retrieved = await getCustomerById(created.id);
    expect(retrieved.full_name).toBe('Ananya Deshmukh');
  });

  it('updates KYC status and logs verification', async () => {
    const customers = await getCustomers();
    const target = customers[0];

    await updateKycStatus(target.id, 'verified', 'auditor@rcbjewelry.in');
    const updated = await getCustomerById(target.id);
    expect(updated.kyc_status).toBe('verified');
    expect(updated.kyc_verified_by).toBe('auditor@rcbjewelry.in');
    expect(updated.kyc_verified_at).toBeDefined();
  });

  it('adjusts loyalty points and elevates tier', async () => {
    const customers = await getCustomers();
    const target = customers[1]; // Vikramaditya (2100 pts)
    const initialPoints = target.loyalty_points || 0;

    await adjustLoyaltyPoints(target.id, 1500, 'Bridal Jewelry Purchase', 'admin@luxury.com');
    const updated = await getCustomerById(target.id);
    expect(updated.loyalty_points).toBe(initialPoints + 1500);
    expect(updated.loyalty_tier).toBeDefined();
  });

  it('records customer payment towards invoice debt', async () => {
    // Divya Balasubramanian (cust-105) has 25000 pending receivables
    await recordCustomerPayment('cust-105', 10000, 'upi', 'UPI-982141', 'invoice');
    const updated = await getCustomerById('cust-105');
    expect(updated.outstanding_receivables).toBe(15000);
  });

  it('exports customer CSV and imports with validation', async () => {
    const csv = await exportCustomersCSV();
    expect(csv).toContain('Customer Code');
    expect(csv).toContain('Rajeshwari Sundaram');

    const importData = `Full Name,Phone,Email,Address,City
Lakshmanan Murugan,9812398123,lakshmanan@gmail.com,55 Bazaar St,Salem`;

    const result = await importCustomersCSV(importData);
    expect(result.importedCount).toBe(1);
    expect(result.errors.length).toBe(0);

    const check = await getCustomers({ searchTerm: 'Lakshmanan' });
    expect(check.length).toBe(1);
  });
});
