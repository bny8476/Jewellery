# API Issues and Recommended Fixes

## 🚨 Critical Issues

### Issue 1: Pledge Creation Not Atomic

**Location**: `src/services/pawnshopService.ts` - `createPledge()` function

**Problem**: 
The function creates a pledge first, then inserts items. If item insertion fails, the pledge is already created in the database, leaving orphaned data.

**Current Code**:
```typescript
export const createPledge = async (pledgeData: PledgeFormData): Promise<Pledge> => {
    const { items, ...pledge } = pledgeData;

    // Calculate totals
    const totalWeight = items.reduce((sum, item) => sum + item.gross_weight_grams, 0);
    const totalValue = items.reduce((sum, item) => sum + (item.item_value || 0), 0);

    // Step 1: Create pledge
    const { data: pledgeRecord, error: pledgeError } = await supabase
        .from('pledges')
        .insert({...})
        .select()
        .single();

    if (pledgeError) throw pledgeError;

    // Step 2: Create items - IF THIS FAILS, PLEDGE IS ALREADY CREATED!
    const { error: itemsError } = await supabase
        .from('pledge_items')
        .insert(itemsWithPledgeId);

    if (itemsError) throw itemsError; // Pledge exists but items don't

    return pledgeRecord;
};
```

**Solution Options**:

#### Option 1: Use Database Transaction (Recommended)
Create a Supabase function (stored procedure) that handles the transaction atomically:

```sql
CREATE OR REPLACE FUNCTION create_pledge_with_items(
    p_customer_id uuid,
    p_pledge_date date,
    p_loan_amount numeric,
    p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_pledge_id uuid;
BEGIN
    -- Insert pledge
    INSERT INTO pledges (customer_id, pledge_date, loan_amount, ...)
    VALUES (p_customer_id, p_pledge_date, p_loan_amount, ...)
    RETURNING id INTO v_pledge_id;

    -- Insert items
    INSERT INTO pledge_items (pledge_id, ...)
    SELECT v_pledge_id, ...
    FROM jsonb_array_elements(p_items);

    RETURN v_pledge_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create pledge: %', SQLERRM;
END;
$$;
```

#### Option 2: Manual Rollback
Add rollback logic:

```typescript
export const createPledge = async (pledgeData: PledgeFormData): Promise<Pledge> => {
    const { items, ...pledge } = pledgeData;
    let pledgeRecord: Pledge | null = null;

    try {
        // Create pledge
        const { data, error: pledgeError } = await supabase
            .from('pledges')
            .insert({...})
            .select()
            .single();

        if (pledgeError) throw pledgeError;
        pledgeRecord = data;

        // Create items
        const { error: itemsError } = await supabase
            .from('pledge_items')
            .insert(itemsWithPledgeId);

        if (itemsError) {
            // Rollback: Delete the pledge
            if (pledgeRecord) {
                await supabase
                    .from('pledges')
                    .delete()
                    .eq('id', pledgeRecord.id);
            }
            throw itemsError;
        }

        return pledgeRecord;
    } catch (error) {
        // Additional cleanup if needed
        throw error;
    }
};
```

**Recommendation**: Use Option 1 (database function) for true atomicity.

---

### Issue 2: Missing Error Handling in Dashboard Stats

**Location**: `src/services/pawnshopService.ts` - `getDashboardStats()`

**Problem**: 
If any query fails, the entire function fails. No partial results or error recovery.

**Current Code**:
```typescript
export const getDashboardStats = async (): Promise<DashboardStats> => {
    // Multiple queries without error handling
    const { data: activePledges } = await supabase.from('pledges')...
    const { count: totalCustomers } = await supabase.from('customers')...
    // If any fails, entire function fails
};
```

**Solution**: Add try-catch for each query:

```typescript
export const getDashboardStats = async (): Promise<DashboardStats> => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get active pledges with error handling
    let totalActivePledges = 0;
    let totalLoanAmount = 0;
    try {
        const { data: activePledges } = await supabase
            .from('pledges')
            .select('loan_amount')
            .in('status', ['active', 'partially_paid']);
        totalActivePledges = activePledges?.length || 0;
        totalLoanAmount = activePledges?.reduce((sum, p) => sum + p.loan_amount, 0) || 0;
    } catch (error) {
        console.error('Error fetching active pledges:', error);
        // Use defaults (0)
    }

    // Similar for other queries...
    
    return {
        total_active_pledges: totalActivePledges,
        // ...
    };
};
```

---

### Issue 3: Missing API Functions

Many API functions are missing. Here's what needs to be added:

#### Additional Pledges
```typescript
export const createAdditionalPledge = async (additional: Partial<AdditionalPledge>): Promise<AdditionalPledge> => {
    const { data, error } = await supabase
        .from('additional_pledges')
        .insert(additional)
        .select()
        .single();
    if (error) throw error;
    
    // Update original pledge
    await supabase
        .from('pledges')
        .update({ 
            total_weight_grams: sql`total_weight_grams + ${additional.additional_weight_grams}`,
            appraised_value: sql`appraised_value + ${additional.additional_amount}`
        })
        .eq('id', additional.original_pledge_id);
    
    return data;
};
```

#### Pledge Sales
```typescript
export const createPledgeSale = async (sale: Partial<PledgeSale>): Promise<PledgeSale> => {
    const { data, error } = await supabase
        .from('pledge_sales')
        .insert(sale)
        .select()
        .single();
    if (error) throw error;
    
    // Update pledge status
    await supabase
        .from('pledges')
        .update({ status: 'sold' })
        .eq('id', sale.pledge_id);
    
    return data;
};
```

#### Bank Pledges
```typescript
export const createBankPledge = async (bankPledge: Partial<BankPledge>): Promise<BankPledge> => {
    const { data, error } = await supabase
        .from('bank_pledges')
        .insert(bankPledge)
        .select()
        .single();
    if (error) throw error;
    
    // Update pledge status
    await supabase
        .from('pledges')
        .update({ status: 'bank_pledged' })
        .eq('id', bankPledge.pledge_id);
    
    return data;
};
```

#### Cash Transactions
```typescript
export const createCashTransaction = async (transaction: Partial<CashTransaction>): Promise<CashTransaction> => {
    const { data, error } = await supabase
        .from('cash_transactions')
        .insert(transaction)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const getCashTransactions = async (startDate?: string, endDate?: string): Promise<CashTransaction[]> => {
    let query = supabase
        .from('cash_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
    
    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};
```

---

## ⚠️ Medium Priority Issues

### Issue 4: No Input Validation

**Problem**: Services don't validate input before database calls.

**Solution**: Add validation using Zod or similar:

```typescript
import { z } from 'zod';

const CustomerFormSchema = z.object({
    full_name: z.string().min(1, 'Name is required'),
    phone: z.string().regex(/^[0-9]{10}$/, 'Invalid phone number'),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().min(1, 'Address is required'),
});

export const createCustomer = async (customer: CustomerFormData): Promise<Customer> => {
    // Validate input
    CustomerFormSchema.parse(customer);
    
    // Then proceed with database insert
    const { data, error } = await supabase...
};
```

### Issue 5: Error Messages Not User-Friendly

**Problem**: Supabase errors are thrown directly without translation.

**Solution**: Create error mapping:

```typescript
const mapSupabaseError = (error: any): string => {
    if (error.code === '23505') return 'This record already exists';
    if (error.code === '23503') return 'Invalid reference to related record';
    if (error.code === '23502') return 'Required field is missing';
    if (error.message?.includes('foreign key')) return 'Cannot delete: related records exist';
    return error.message || 'An error occurred';
};
```

---

## 📝 Summary

**Critical Fixes Needed**:
1. ✅ Make pledge creation atomic (use database function)
2. ✅ Add error handling to dashboard stats
3. ✅ Implement missing API functions

**Recommended Improvements**:
4. Add input validation
5. Improve error messages
6. Add transaction safety to all multi-step operations

---

**Status**: Most APIs work correctly, but transaction safety and missing functions need attention.

