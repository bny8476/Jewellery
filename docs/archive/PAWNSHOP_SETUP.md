# Pawnshop Management System - Setup Guide

## 🎯 Overview

A comprehensive pawnshop management system with:
- **Dashboard** with live gold/silver rates (editable)
- **Master Data Management** (Companies, Loan Types, Jewellery Types, Schemes, Banks, Users)
- **Customer Management** with search and CRUD operations
- **Transaction Management** (Pledge Entry, Returns, Part Payments, Sales)
- **Bank Operations** (Bank Pledges)
- **Accounts** (Cash Transactions)
- **Reports** (Detail, Customer Pledge, Bank Pledge, Sales Reports)

## 📋 Prerequisites

- Node.js installed
- Supabase account
- Project dependencies installed (`npm install`)

## 🚀 Database Setup

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Schema Script

1. Open the file: `supabase/pawnshop-schema.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** or press `Ctrl+Enter`

This will create:
- ✅ All database tables (19 tables)
- ✅ Indexes for performance
- ✅ Row Level Security policies
- ✅ Auto-increment functions for pledge numbers and customer codes
- ✅ Sample master data (loan types, jewellery types, schemes, etc.)
- ✅ Default metal rates (Gold: ₹10,200/g, Silver: ₹300/g)

### Step 3: Verify Setup

Run this query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'metal_rates', 'companies', 'loan_types', 'jewellery_types', 
  'schemes', 'bank_master', 'customers', 'pledges'
)
ORDER BY table_name;
```

You should see all 8+ tables listed.

## 🔧 Application Setup

### 1. Environment Configuration

Make sure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Access Admin Panel

Navigate to: `http://localhost:5173/admin`

## 📊 Features

### Dashboard
- **Live Stats**: Active pledges, total loan amount, customer count, cash in hand
- **Today's Activity**: New pledges and returns
- **Metal Rates**: Editable gold and silver rates (click "Edit Rates" button)
- **Quick Actions**: Fast access to common operations

### Master Data Management

#### Company Master
- Manage company/branch details
- Configure print headers and footers
- Set language preference (English/Tamil/Hindi)

#### Loan Types
- Define different loan categories
- Gold Loan, Silver Loan, Diamond Loan, etc.

#### Jewellery Types
- Categorize jewellery items
- Chains, Rings, Bangles, etc.

#### Schemes
- Create loan schemes with interest rates
- Set redemption periods
- Configure penalty rates
- Support for monthly/annual/daily interest

#### Bank Master
- Manage bank details for bank pledge operations
- Store account numbers, IFSC codes, contact persons

### Customer Management
- **Add Customers**: Full customer details with ID proof
- **Search**: By name, phone, or customer code
- **Auto-generated Customer Codes**: CUST000001, CUST000002, etc.
- **Customer Profile**: View transaction history (coming soon)

### Transaction Management (Placeholders Ready)
- Pledge Entry
- Additional Pledge Entry
- Pledge Return
- Part Payment Return
- Pledge Sales Entry
- Cancel Transaction

### Bank Operations (Placeholders Ready)
- Bank Pledge Entry
- Bank Pledge Receive

### Accounts (Placeholders Ready)
- Cash In/Out transactions
- Daily reconciliation

### Reports (Placeholders Ready)
- Detail Report
- Customer Pledge Report
- Bank Pledge Report
- Pledge Sales Report
- Export to PDF/Excel

## 🎨 UI Features

- **Modern Design**: Gradient backgrounds, shadow effects, smooth transitions
- **Responsive**: Works on desktop, tablet, and mobile
- **Color-coded Stats**: Visual indicators for different metrics
- **Tabbed Navigation**: Easy switching between sections
- **Form Validation**: Required fields and data type checking
- **Loading States**: Smooth loading animations

## 📝 Database Schema Highlights

### Auto-Generated Codes
- **Customer Code**: CUST000001, CUST000002, etc.
- **Pledge Number**: PLG000001, PLG000002, etc.

### Key Relationships
- Customers → Pledges (one-to-many)
- Pledges → Pledge Items (one-to-many)
- Pledges → Part Payments (one-to-many)
- Schemes → Pledges (one-to-many)

### Status Tracking
- Pledge Status: active, partially_paid, closed, sold, bank_pledged
- Bank Pledge Status: sent, received, settled

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Public read access for master data (adjust as needed)
- Authenticated access for transactions (to be implemented)

## 📱 Next Steps

1. **Run the SQL script** in Supabase SQL Editor
2. **Test the admin panel** - add companies, loan types, customers
3. **Customize master data** - add your own schemes, jewellery types
4. **Update metal rates** - set current gold/silver prices
5. **Implement authentication** - add login system for users
6. **Complete transaction modules** - implement pledge entry forms
7. **Add reports** - connect report generation to live data

## 🐛 Troubleshooting

### Database Connection Error
- Verify Supabase URL and anon key in `.env`
- Check if Supabase project is active
- Ensure RLS policies allow public read access

### Tables Not Found
- Run the SQL script in Supabase SQL Editor
- Check for any SQL errors in the editor
- Verify tables exist in Supabase Table Editor

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Clear node_modules and reinstall if needed
- Check for TypeScript errors

## 📞 Support

For issues or questions:
1. Check the implementation plan: `implementation_plan.md`
2. Review the task breakdown: `task.md`
3. Inspect browser console for errors
4. Check Supabase logs for database errors

## 🎉 Success Checklist

- [ ] SQL script executed successfully in Supabase
- [ ] All tables visible in Supabase Table Editor
- [ ] Sample data inserted (check `companies`, `loan_types`, etc.)
- [ ] Application builds without errors (`npm run build`)
- [ ] Admin panel loads at `/admin`
- [ ] Dashboard shows metal rates
- [ ] Can edit gold/silver rates
- [ ] Can add/edit companies
- [ ] Can add/edit loan types, jewellery types, schemes
- [ ] Can add/edit customers
- [ ] Customer search works

---

**Built with**: React + TypeScript + Vite + Supabase + TailwindCSS
