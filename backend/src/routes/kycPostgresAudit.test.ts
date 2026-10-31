import fs from 'fs';
import path from 'path';

// Pre-load backend/.env before db.ts initializes pool
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=(.+)/);
    if (match) {
      process.env.DATABASE_URL = match[1].trim();
    }
  }
}

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { queryDb, getDbPool } from '../db.ts';

describe('PostgreSQL Customer KYC Schema Audit & Workflow Verification', () => {
  const testCustomerId = '11111111-2222-4333-8444-555555555555';
  const testUserId = '66666666-7777-4888-8999-000000000000';
  const testCustomerCode = `TEST-CUST-${Date.now().toString().slice(-5)}`;

  beforeAll(async () => {
    // Clean up test customer if present
    await queryDb(`DELETE FROM public.customers WHERE id = $1 OR user_id = $2`, [testCustomerId, testUserId]);
  });

  afterAll(async () => {
    // Clean up test customer
    await queryDb(`DELETE FROM public.customers WHERE id = $1 OR user_id = $2`, [testCustomerId, testUserId]);
  });

  it('1. Verifies kyc_status column exists on public.customers in PostgreSQL', async () => {
    const columns = await queryDb<{ column_name: string; data_type: string; column_default: string }>(
      `SELECT column_name, data_type, column_default 
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'kyc_status'`
    );

    expect(columns.length).toBe(1);
    expect(columns[0].column_name).toBe('kyc_status');
    expect(columns[0].data_type).toBe('text');
  });

  it('2. Verifies new customer record receives default status of UNVERIFIED', async () => {
    await queryDb(
      `INSERT INTO public.customers (
         id, user_id, customer_code, full_name, phone, address, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [testCustomerId, testUserId, testCustomerCode, 'Test Patron A', '9840199999', '123 Fine Jewels Way, Chennai']
    );

    const rows = await queryDb<{ id: string; kyc_status: string }>(
      `SELECT id, kyc_status FROM public.customers WHERE id = $1`,
      [testCustomerId]
    );

    expect(rows.length).toBe(1);
    expect(rows[0].kyc_status).toBe('UNVERIFIED');
  });

  it('3. Verifies check constraint prevents invalid kyc_status values', async () => {
    await expect(
      queryDb(
        `UPDATE public.customers SET kyc_status = 'BOGUS_STATUS' WHERE id = $1`,
        [testCustomerId]
      )
    ).rejects.toThrow();
  });

  it('4. Verifies KYC submission updates customer status to PENDING with masked identity details', async () => {
    await queryDb(
      `UPDATE public.customers 
       SET kyc_status = 'PENDING', 
           pan_number_masked = 'ABCDE••••F', 
           aadhaar_number_masked = '•••• •••• 1234', 
           updated_at = NOW() 
       WHERE id = $1`,
      [testCustomerId]
    );

    const rows = await queryDb<{ kyc_status: string; pan_number_masked: string; aadhaar_number_masked: string }>(
      `SELECT kyc_status, pan_number_masked, aadhaar_number_masked FROM public.customers WHERE id = $1`,
      [testCustomerId]
    );

    expect(rows[0].kyc_status).toBe('PENDING');
    expect(rows[0].pan_number_masked).toBe('ABCDE••••F');
    expect(rows[0].aadhaar_number_masked).toBe('•••• •••• 1234');
  });

  it('5. Verifies authorized admin approval transitions customer status to VERIFIED', async () => {
    const reviewerName = 'Chief Compliance Officer';
    await queryDb(
      `UPDATE public.customers 
       SET kyc_status = 'VERIFIED', 
           kyc_verified_at = NOW(), 
           kyc_verified_by = $1, 
           updated_at = NOW() 
       WHERE id = $2`,
      [reviewerName, testCustomerId]
    );

    const rows = await queryDb<{ kyc_status: string; kyc_verified_by: string; kyc_verified_at: string }>(
      `SELECT kyc_status, kyc_verified_by, kyc_verified_at FROM public.customers WHERE id = $1`,
      [testCustomerId]
    );

    expect(rows[0].kyc_status).toBe('VERIFIED');
    expect(rows[0].kyc_verified_by).toBe(reviewerName);
    expect(rows[0].kyc_verified_at).not.toBeNull();
  });

  it('6. Verifies admin rejection transitions customer status to REJECTED with rejection reason', async () => {
    const reason = 'Document scan blurry - please upload clear PAN card';
    await queryDb(
      `UPDATE public.customers 
       SET kyc_status = 'REJECTED', 
           kyc_rejection_reason = $1, 
           updated_at = NOW() 
       WHERE id = $2`,
      [reason, testCustomerId]
    );

    const rows = await queryDb<{ kyc_status: string; kyc_rejection_reason: string }>(
      `SELECT kyc_status, kyc_rejection_reason FROM public.customers WHERE id = $1`,
      [testCustomerId]
    );

    expect(rows[0].kyc_status).toBe('REJECTED');
    expect(rows[0].kyc_rejection_reason).toBe(reason);
  });

  it('7. Verifies no missing-column errors occur when reading customer kyc_status in relations', async () => {
    const query = `
      SELECT 
        c.id, c.customer_code, c.full_name, c.kyc_status, c.pan_number_masked, c.aadhaar_number_masked,
        c.kyc_verified_at, c.kyc_verified_by, c.kyc_rejection_reason
      FROM public.customers c
      WHERE c.id = $1
    `;
    const rows = await queryDb(query, [testCustomerId]);
    expect(rows.length).toBe(1);
    expect(rows[0]).toHaveProperty('kyc_status');
  });

  it('8. Verifies concurrent customer KYC status updates execute atomically without data loss', async () => {
    const updatePromises = [
      queryDb(`UPDATE public.customers SET kyc_status = 'PENDING', updated_at = NOW() WHERE id = $1`, [testCustomerId]),
      queryDb(`UPDATE public.customers SET pan_number_masked = 'ABCPE9999F', updated_at = NOW() WHERE id = $1`, [testCustomerId]),
      queryDb(`UPDATE public.customers SET aadhaar_number_masked = '•••• •••• 9999', updated_at = NOW() WHERE id = $1`, [testCustomerId])
    ];

    await Promise.all(updatePromises);

    const rows = await queryDb<{ kyc_status: string; pan_number_masked: string; aadhaar_number_masked: string }>(
      `SELECT kyc_status, pan_number_masked, aadhaar_number_masked FROM public.customers WHERE id = $1`,
      [testCustomerId]
    );

    expect(rows[0].kyc_status).toBe('PENDING');
    expect(rows[0].pan_number_masked).toBe('ABCPE9999F');
    expect(rows[0].aadhaar_number_masked).toBe('•••• •••• 9999');
  });
});
