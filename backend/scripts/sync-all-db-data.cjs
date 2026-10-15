const { Client } = require('pg');

const path = require('path');
const fs = require('fs');

// Attempt loading from .env if process.env.DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) process.env.DATABASE_URL = match[1];
  }
}

const databaseUrl = process.env.DATABASE_URL || '';
if (!databaseUrl) {
  console.error('❌ Error: Missing DATABASE_URL in environment variables.');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('🔌 Connecting to Supabase PostgreSQL Database...');
    await client.connect();
    console.log('✅ Connected successfully to Supabase DB!\n');

    // 1. Ensure user_id column exists on customers and relax constraints
    console.log('📦 Updating table schemas...');
    await client.query(`
      ALTER TABLE public.customers ALTER COLUMN address DROP NOT NULL;
      ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id uuid;
      ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'PENDING';
    `);

    // 2. Create jewelry_items table for e-commerce
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.jewelry_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        price numeric NOT NULL CHECK (price >= 0),
        category text NOT NULL,
        image_url text,
        metal_type text DEFAULT 'gold',
        weight numeric DEFAULT 0,
        wastage_percent numeric DEFAULT 0,
        stock integer DEFAULT 10,
        purity text DEFAULT '22K',
        gender text DEFAULT 'unisex',
        occasion text DEFAULT 'Daily',
        is_featured boolean DEFAULT false,
        is_bestseller boolean DEFAULT false,
        is_new boolean DEFAULT false,
        in_stock boolean DEFAULT true,
        rating numeric DEFAULT 4.9,
        reviews_count integer DEFAULT 12,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);

    // 3. Create orders table for jewelry store
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid,
        customer_id uuid,
        customer_name text,
        customer_email text,
        customer_phone text,
        shipping_address text,
        total_amount numeric NOT NULL,
        payment_status text DEFAULT 'paid',
        fulfillment_status text DEFAULT 'processing',
        payment_method text DEFAULT 'razorpay',
        razorpay_order_id text,
        razorpay_payment_id text,
        items jsonb,
        notes text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);

    // 4. Create order_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.order_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
        jewelry_item_id uuid,
        product_name text NOT NULL,
        quantity integer NOT NULL DEFAULT 1,
        unit_price numeric NOT NULL,
        total_price numeric NOT NULL,
        created_at timestamptz DEFAULT now()
      );
    `);

    // 5. Create pawn_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.pawn_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid,
        customer_name text,
        phone text,
        email text,
        item_type text,
        item_description text NOT NULL,
        estimated_weight numeric,
        requested_amount numeric NOT NULL,
        status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        notes text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);

    // 6. Create profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE,
        full_name text,
        phone text,
        address text,
        role text DEFAULT 'customer',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);

    console.log('✅ All e-commerce and pawnshop tables confirmed/created!\n');

    // 7. Migrate/Sync JewelryItem -> jewelry_items
    console.log('💎 Synchronizing Jewelry Items...');
    const jiRes = await client.query(`SELECT count(*) FROM public.jewelry_items`);
    if (parseInt(jiRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO public.jewelry_items (
          id, name, description, price, category, image_url, metal_type, weight, wastage_percent, stock, in_stock, created_at, updated_at
        )
        SELECT 
          id, 
          name, 
          description, 
          price, 
          category, 
          "imageUrl", 
          LOWER("metalType"), 
          "weightGrams", 
          "wastagePercent", 
          stock, 
          "isActive", 
          "createdAt", 
          "updatedAt"
        FROM public."JewelryItem"
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          stock = EXCLUDED.stock,
          image_url = EXCLUDED.image_url;
      `);
      console.log('✅ Migrated 11 items from "JewelryItem" to public.jewelry_items!');
    } else {
      console.log(`ℹ️ jewelry_items already has ${jiRes.rows[0].count} items.`);
    }

    // 8. Migrate Customer -> customers
    console.log('👤 Synchronizing Customers...');
    const custRes = await client.query(`SELECT count(*) FROM public.customers`);
    if (parseInt(custRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO public.customers (
          id, full_name, phone, email, address, is_active, created_at, updated_at, kyc_status
        )
        SELECT 
          id, 
          "fullName", 
          phone, 
          email, 
          COALESCE(address, '123 Fintech Street, Chennai'), 
          NOT "isBlocked", 
          "createdAt", 
          "updatedAt",
          COALESCE("kycStatus", 'PENDING')
        FROM public."Customer"
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('✅ Migrated existing customers from "Customer" to public.customers!');
    } else {
      console.log(`ℹ️ customers table already has ${custRes.rows[0].count} rows.`);
    }

    // 9. Migrate Company -> companies
    console.log('🏢 Synchronizing Companies...');
    const compRes = await client.query(`SELECT count(*) FROM public.companies`);
    if (parseInt(compRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO public.companies (
          id, company_name, branch_name, phone, email, address, created_at, updated_at
        )
        SELECT 
          id, 
          "companyName", 
          COALESCE("branchName", 'Main Branch'), 
          phone, 
          email, 
          address, 
          "createdAt", 
          "updatedAt"
        FROM public."Company"
        ON CONFLICT DO NOTHING;
      `);
      console.log('✅ Migrated company records!');
    }

    // 10. Migrate Pledge -> pledges
    console.log('📜 Synchronizing Pledges/Loans...');
    const plRes = await client.query(`SELECT count(*) FROM public.pledges`);
    if (parseInt(plRes.rows[0].count, 10) === 0) {
      // Find a company id to assign
      const compIdRow = await client.query(`SELECT id FROM public.companies LIMIT 1`);
      const defaultCompanyId = compIdRow.rows.length > 0 ? compIdRow.rows[0].id : null;

      // Relax appraised_value constraint if present
      await client.query(`ALTER TABLE public.pledges ALTER COLUMN appraised_value DROP NOT NULL;`);

      await client.query(`
        INSERT INTO public.pledges (
          id, pledge_number, customer_id, company_id, appraised_value, loan_amount, interest_rate, interest_type, 
          total_weight_grams, total_items, status, notes, created_at, updated_at
        )
        SELECT 
          id, 
          "pledgeNumber", 
          "customerId", 
          $1, 
          ("loanAmount" * 1.3),
          "loanAmount", 
          "interestRate", 
          LOWER("interestType"::text), 
          "totalWeightGrams", 
          "totalItems", 
          LOWER(status::text), 
          notes, 
          "createdAt", 
          "updatedAt"
        FROM public."Pledge"
        ON CONFLICT (id) DO NOTHING;
      `, [defaultCompanyId]);
      console.log('✅ Migrated active pledges from "Pledge" to public.pledges!');

    } else {
      console.log(`ℹ️ pledges table already has ${plRes.rows[0].count} rows.`);
    }

    // 10b. Migrate PledgeItem -> pledge_items
    console.log('📦 Synchronizing Pledge Items...');
    const piRes = await client.query(`SELECT count(*) FROM public.pledge_items`);
    if (parseInt(piRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO public.pledge_items (
          id, pledge_id, item_description, gross_weight_grams, net_weight_grams, purity, quantity, item_value, created_at
        )
        SELECT 
          id, 
          "pledgeId", 
          "itemDescription", 
          "grossWeightGrams", 
          "netWeightGrams", 
          purity, 
          quantity, 
          "itemValue", 
          "createdAt"
        FROM public."PledgeItem"
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('✅ Migrated pledge items from "PledgeItem" to public.pledge_items!');
    } else {
      console.log(`ℹ️ pledge_items table already has ${piRes.rows[0].count} rows.`);
    }

    // 11. Migrate User/Customer -> profiles
    console.log('🔐 Synchronizing User Profiles...');
    await client.query(`
      INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
      SELECT id, email, "fullName", 'customer', "createdAt", "updatedAt"
      FROM public."Customer"
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
      SELECT id, email, 'Administrator', LOWER(role::text), "createdAt", "updatedAt"
      FROM public."User"
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ User profiles synchronized!');

    // 12. Final Verification of Row Counts
    console.log('\n=============================================');
    console.log('📊 FINAL DATABASE STORAGE VERIFICATION');
    console.log('=============================================');
    const allTables = [
      'jewelry_items', 'JewelryItem',
      'customers', 'Customer',
      'pledges', 'Pledge',
      'metal_rates', 'MetalRate',
      'orders', 'Order',
      'pawn_requests',
      'profiles', 'User',
      'companies', 'Company',
      'schemes', 'Scheme',
      'loan_types', 'LoanType',
      'jewellery_types', 'JewelleryType',
      'bank_master', 'BankMaster',
      'Wallet', 'Holding'
    ];

    for (const table of allTables) {
      try {
        const countRes = await client.query(`SELECT count(*) as cnt FROM "${table}"`);
        console.log(`  ✓ ${table.padEnd(20)} : ${countRes.rows[0].cnt} rows`);
      } catch (err) {
        console.log(`  ✗ ${table.padEnd(20)} : Error (${err.message})`);
      }
    }
    console.log('=============================================\n');

  } catch (err) {
    console.error('❌ Error during synchronization:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
