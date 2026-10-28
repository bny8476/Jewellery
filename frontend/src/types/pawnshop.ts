// ============================================
// PAWNSHOP MANAGEMENT SYSTEM - TYPE DEFINITIONS
// ============================================

// Master Data Types
export interface MetalRate {
    id: string;
    metal_type: 'gold' | 'silver';
    rate_per_gram: number;
    effective_date: string;
    created_at: string;
    updated_at: string;
}

export interface Company {
    id: string;
    company_name: string;
    branch_name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    gst_number?: string;
    license_number?: string;
    logo_url?: string;
    print_header?: string;
    print_footer?: string;
    language_preference: 'en' | 'ta' | 'hi';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoanType {
    id: string;
    loan_type_name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface JewelleryType {
    id: string;
    jewellery_type_name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Scheme {
    id: string;
    scheme_name: string;
    interest_rate: number;
    interest_type: 'monthly' | 'annual' | 'daily';
    min_amount?: number;
    max_amount?: number;
    redemption_period_days: number;
    penalty_rate: number;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BankMaster {
    id: string;
    bank_name: string;
    branch_name?: string;
    account_number?: string;
    ifsc_code?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AppUser {
    id: string;
    username: string;
    password_hash: string;
    full_name?: string;
    role: 'admin' | 'manager' | 'staff';
    email?: string;
    phone?: string;
    // Enhanced fields
    designation?: string;
    qualification?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: string;
    id_proof_type?: string;
    id_proof_number?: string;
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
    photo_url?: string;
    is_blocked?: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Customer Types
export interface Customer {
    id: string;
    customer_code: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    father_name?: string;
    date_of_birth?: string;
    anniversary_date?: string;
    gender?: 'male' | 'female' | 'other';
    phone: string;
    alternate_phone?: string;
    email?: string;
    address: string;
    street?: string;
    locality?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    preferred_language?: string;
    customer_type?: 'individual' | 'business';
    category?: 'retail' | 'wholesale' | 'vip' | 'hni' | 'loyal';
    id_proof_type?: 'aadhar' | 'pan' | 'voter_id' | 'passport' | 'driving_license';
    id_proof_number?: string;
    photo_url?: string;
    user_id?: string;
    // KYC
    kyc_status?: 'verified' | 'pending' | 'rejected' | 'expired';
    kyc_verified_at?: string;
    kyc_verified_by?: string;
    kyc_rejection_reason?: string;
    // Loyalty & CRM
    loyalty_tier?: 'Standard' | 'Silver' | 'Gold' | 'VIP';
    loyalty_points?: number;
    total_purchases?: number;
    total_purchase_value?: number;
    active_pawn_loans?: number;
    outstanding_pawn_principal?: number;
    outstanding_receivables?: number;
    last_purchase_date?: string;
    last_interaction_date?: string;
    assigned_staff?: string;
    communication_consent?: {
        sms: boolean;
        whatsapp: boolean;
        email: boolean;
        promotions: boolean;
        birthday_reminders: boolean;
    };
    product_interests?: string[];
    // Nominee Details
    nominee_name?: string;
    nominee_relation?: string;
    nominee_contact?: string;
    nominee_id_proof?: string;
    username?: string;
    password_hash?: string;
    is_active: boolean;
    is_blocked?: boolean;
    block_reason?: string;
    created_at: string;
    updated_at: string;
}

export interface CustomerDocument {
    id: string;
    customer_id: string;
    document_type: 'aadhar' | 'pan' | 'voter_id' | 'passport' | 'driving_license' | 'address_proof' | 'income_proof' | 'other';
    document_name?: string;
    document_number?: string;
    document_url: string;
    file_size_kb?: number;
    status: 'verified' | 'pending' | 'rejected' | 'expired';
    verified_by?: string;
    verified_at?: string;
    notes?: string;
    uploaded_at: string;
}

export interface CustomerNote {
    id: string;
    customer_id: string;
    title: string;
    content: string;
    category: 'general' | 'sales' | 'pawn' | 'complaint' | 'vip' | 'service';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    is_sensitive: boolean;
    created_by: string;
    created_at: string;
}

export interface CustomerFollowUpTask {
    id: string;
    customer_id: string;
    title: string;
    description: string;
    assigned_staff: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    completion_notes?: string;
    created_at: string;
}

export interface CustomerCommunication {
    id: string;
    customer_id: string;
    channel: 'sms' | 'whatsapp' | 'email' | 'phone_call' | 'in_person';
    direction: 'outbound' | 'inbound';
    subject: string;
    message: string;
    status: 'sent' | 'delivered' | 'failed' | 'logged';
    logged_by: string;
    created_at: string;
}

export interface CustomerAppointment {
    id: string;
    customer_id: string;
    service_type: 'Jewellery Consultation' | 'Bridal Viewing' | 'Gold Valuation' | 'Pawn Loan Appraisal' | 'Maintenance & Polish' | 'Custom Design';
    scheduled_at: string;
    duration_minutes: number;
    assigned_staff: string;
    status: 'confirmed' | 'pending' | 'rescheduled' | 'completed' | 'cancelled';
    notes?: string;
    created_at: string;
}

export interface CustomerComplaint {
    id: string;
    customer_id: string;
    ticket_number: string;
    category: 'Product Quality' | 'Billing / Pricing' | 'Pawn Terms' | 'Staff Behaviour' | 'Delay' | 'General Feedback';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'investigating' | 'resolved' | 'closed';
    description: string;
    resolution_notes?: string;
    assigned_to: string;
    resolution_deadline?: string;
    created_at: string;
    resolved_at?: string;
}

export interface CustomerLoyaltyLog {
    id: string;
    customer_id: string;
    points_change: number;
    reason: string;
    transaction_ref?: string;
    balance_after: number;
    recorded_by: string;
    created_at: string;
}

export interface CustomerActivityItem {
    id: string;
    customer_id: string;
    type: 'purchase' | 'pawn_loan' | 'repayment' | 'kyc_update' | 'note' | 'communication' | 'appointment' | 'complaint' | 'loyalty';
    title: string;
    description: string;
    amount?: number;
    metadata?: Record<string, any>;
    actor: string;
    created_at: string;
}

export interface CustomerStats {
    total_customers: number;
    new_this_month: number;
    active_customers: number;
    repeat_customers: number;
    pending_payment_customers: number;
    active_pawn_customers: number;
    overdue_loan_customers: number;
    pending_kyc_customers: number;
    vip_loyalty_customers: number;
    upcoming_birthdays: number;
}

export interface CustomerFilterOptions {
    searchTerm?: string;
    category?: 'all' | 'retail' | 'wholesale' | 'vip' | 'hni' | 'loyal';
    kyc_status?: 'all' | 'verified' | 'pending' | 'rejected' | 'expired';
    loyalty_tier?: 'all' | 'Standard' | 'Silver' | 'Gold' | 'VIP';
    loan_status?: 'all' | 'active_loans' | 'overdue_loans' | 'no_loans';
    has_balance?: boolean;
    is_repeat?: boolean;
    assigned_staff?: string;
}

// Transaction Types
export interface Pledge {
    id: string;
    pledge_number: string;
    customer_id: string;
    company_id?: string;
    loan_type_id?: string;
    scheme_id?: string;
    pledge_date: string;
    total_weight_grams: number;
    total_items: number;
    appraised_value: number;
    loan_amount: number;
    interest_rate: number;
    interest_type: 'monthly' | 'annual' | 'daily';
    redemption_date?: string;
    status: 'active' | 'partially_paid' | 'closed' | 'sold' | 'bank_pledged';
    document_charges?: number; // Added Phase 2
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface PledgeItem {
    id: string;
    pledge_id: string;
    jewellery_type_id?: string;
    item_description: string;
    gross_weight_grams: number;
    net_weight_grams: number;
    purity?: string;
    quantity: number;
    item_value?: number;
    photo_url?: string;
    purity_test_value?: string;
    created_at: string;
}

export interface AdditionalPledge {
    id: string;
    original_pledge_id: string;
    additional_date: string;
    additional_weight_grams: number;
    additional_amount: number;
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface PartPayment {
    id: string;
    pledge_id: string;
    payment_date: string;
    payment_amount: number;
    principal_paid: number;
    interest_paid: number;
    payment_mode?: 'cash' | 'upi' | 'card' | 'bank_transfer';
    receipt_number?: string;
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface PledgeReturn {
    id: string;
    pledge_id: string;
    return_date: string;
    principal_amount: number;
    interest_amount: number;
    penalty_amount: number;
    total_amount: number;
    payment_mode?: 'cash' | 'upi' | 'card' | 'bank_transfer';
    receipt_number?: string;
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface PledgeSale {
    id: string;
    pledge_id: string;
    sale_date: string;
    sale_amount: number;
    buyer_name?: string;
    buyer_phone?: string;
    payment_mode?: 'cash' | 'upi' | 'card' | 'bank_transfer';
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface CancelledTransaction {
    id: string;
    transaction_type: string;
    transaction_id: string;
    cancellation_date: string;
    reason: string;
    cancelled_by?: string;
    created_at: string;
}

// Bank Operations Types
export interface BankPledge {
    id: string;
    pledge_id: string;
    bank_id: string;
    sent_date: string;
    amount_received: number;
    bank_interest_rate?: number;
    expected_return_date?: string;
    status: 'sent' | 'received' | 'settled';
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface BankPledgeReceive {
    id: string;
    bank_pledge_id: string;
    received_date: string;
    amount_paid: number;
    interest_paid: number;
    notes?: string;
    created_by?: string;
    created_at: string;
}

// Accounts Types
export interface CashTransaction {
    id: string;
    transaction_date: string;
    transaction_type: 'cash_in' | 'cash_out';
    amount: number;
    category: string;
    reference_type?: string;
    reference_id?: string;
    description?: string;
    payment_mode?: 'cash' | 'upi' | 'card' | 'bank_transfer';
    created_by?: string;
    created_at: string;
}

// Extended Types with Relations
export interface PledgeWithDetails extends Pledge {
    customer?: Customer;
    company?: Company;
    loan_type?: LoanType;
    scheme?: Scheme;
    items?: PledgeItem[];
    part_payments?: PartPayment[];
}

export interface CustomerWithPledges extends Customer {
    pledges?: Pledge[];
    total_active_pledges?: number;
    total_loan_amount?: number;
}

// Dashboard Types
export interface DashboardStats {
    total_active_pledges: number;
    total_loan_amount: number;
    total_customers: number;
    today_pledges: number;
    today_returns: number;
    cash_in_hand: number;
    gold_rate: number;
    silver_rate: number;
    // Real Business KPIs
    total_inventory_items?: number;
    total_inventory_value?: number;
    today_sales?: number;
    today_purchases?: number;
    loans_due_today?: number;
    overdue_loans?: number;
    payments_received_today?: number;
    estimated_profit?: number;
}

// Form Types
export interface PledgeFormData {
    customer_id: string;
    company_id?: string;
    loan_type_id?: string;
    scheme_id?: string;
    pledge_date: string;
    loan_amount: number;
    interest_rate: number;
    interest_type: 'monthly' | 'annual' | 'daily';
    document_charges?: number;
    pledge_number?: string; // New: Custom bill number
    notes?: string;
    items: PledgeItemFormData[];
}

export interface PledgeItemFormData {
    jewellery_type_id?: string;
    item_description: string;
    gross_weight_grams: number;
    net_weight_grams: number;
    purity?: string;
    quantity: number;
    item_value?: number;
    photo_url?: string;
    purity_test_value?: string;
}

export interface CustomerFormData {
    full_name: string;
    father_name?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    phone: string;
    alternate_phone?: string;
    email?: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    id_proof_type?: 'aadhar' | 'pan' | 'voter_id' | 'passport' | 'driving_license';
    id_proof_number?: string;
    photo_url?: string;
    nominee_name?: string;
    nominee_relation?: string;
    nominee_contact?: string;
    nominee_id_proof?: string;
    username?: string;
    password?: string;
}

// Report Types
export interface DayBookRow {
    date: string;
    particulars: string;
    credit: number;
    debit: number;
    balance: number;
}

export interface InterestPendingRow {
    bill_no: string;
    date: string;
    customer_name: string;
    mobile: string;
    interest_rate: number;
    months_due: number;
    net_weight: string;
    loan_amount: number;
    interest_amount: string;
    total_due: string;
}

export interface InterestCollectionRow {
    bill_no: string;
    date: string;
    customer_name: string;
    interest_collected: number;
    type: 'Part Payment' | 'Final Settlement';
}

export interface CustomerPledgeReportRow {
    bill_no: string;
    date: string;
    customer_name: string;
    mobile: string;
    net_weight: string | number;
    amount: number; // Loan Amount
    status: string;
    type: string; // New, In Bank, Active, etc.
}

export interface PledgeReturnRow {
    bill_no: string;
    return_date: string;
    customer_name: string;
    mobile: string;
    net_weight: string;
    loan_amount: number;
    received_amount: number;
    status: string;
}

export interface BankPledgeRow {
    // Defines structure for bank pledge report
    bank_name: string;
    pledge_number: string;
    loan_amount: number;
    amount_received: number;
    sent_date: string;
    status: string;
}

export interface PledgeSaleRow {
    pledge_number: string;
    loan_amount: number;
    sale_amount: number;
    sale_date: string;
    buyer_name: string;
}

export interface DetailReportRow {
    pledge_number: string;
    pledge_date: string;
    customer_name: string;
    customer_phone: string;
    loan_amount: number;
    interest_amount: number;
    total_paid: number;
    outstanding: number;
    status: string;
}

// Order Types
export interface Order {
    id: string; // ORD-XXXX
    order_number?: string;
    user_id: string;
    customer_name?: string;
    customer_phone?: string;
    total_amount: number;
    discount_amount?: number;
    coupon_code?: string;
    tracking_number?: string;
    courier_partner?: string;
    status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
    shipping_address: {
        fullName: string;
        street: string;
        city: string;
        zipCode: string;
        phone: string;
    };
    created_at: string;
    updated_at: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_name: string;
    price: number;
    weight: number;
    unit: string;
    image_url?: string;
    quantity: number;
    created_at: string;
}
