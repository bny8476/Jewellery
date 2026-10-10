import { supabase } from '../lib/supabase';
import type { Customer, CustomerFormData } from '../types/pawnshop';
import { handleApiError, logError } from '../utils/errorHandler';
import { validateRequired, validateMinLength, validatePhone, validateEmail, validatePincode } from '../utils/validation';

// ============================================
// CUSTOMERS
// ============================================

export const getCustomers = async (searchTerm?: string): Promise<Customer[]> => {
    return handleApiError(async () => {
        let query = supabase
            .from('customers')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (searchTerm) {
            query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) {
            logError(error, 'getCustomers');
            throw error;
        }
        return data || [];
    });
};

export const getCustomerById = async (id: string): Promise<Customer> => {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

export const createCustomer = async (customer: CustomerFormData): Promise<Customer> => {
    return handleApiError(async () => {
        // Strict service-level validation
        if (!validateRequired(customer.full_name) || !validateMinLength(customer.full_name, 2)) {
            throw new Error('Valid customer full name (at least 2 characters) is required');
        }
        if (!validateRequired(customer.phone) || !validatePhone(customer.phone)) {
            throw new Error('Valid 10-digit Indian phone number is required');
        }
        if (!validateRequired(customer.address) || !validateMinLength(customer.address, 5)) {
            throw new Error('Valid address (at least 5 characters) is required');
        }
        if (customer.email && !validateEmail(customer.email)) {
            throw new Error('Invalid email address format');
        }
        if (customer.pincode && !validatePincode(customer.pincode)) {
            throw new Error('Invalid 6-digit PIN code format');
        }

        const { data, error } = await supabase
            .from('customers')
            .insert(customer)
            .select()
            .single();

        if (error) {
            logError(error, 'createCustomer');
            throw error;
        }
        return data;
    });
};

export const updateCustomer = async (id: string, customer: Partial<CustomerFormData>): Promise<void> => {
    return handleApiError(async () => {
        if (!id) throw new Error('Customer ID is required');

        if (customer.full_name !== undefined && (!validateRequired(customer.full_name) || !validateMinLength(customer.full_name, 2))) {
            throw new Error('Valid customer full name (at least 2 characters) is required');
        }
        if (customer.phone !== undefined && (!validateRequired(customer.phone) || !validatePhone(customer.phone))) {
            throw new Error('Valid 10-digit Indian phone number is required');
        }
        if (customer.email && !validateEmail(customer.email)) {
            throw new Error('Invalid email address format');
        }
        if (customer.pincode && !validatePincode(customer.pincode)) {
            throw new Error('Invalid 6-digit PIN code format');
        }

        const { error } = await supabase
            .from('customers')
            .update(customer)
            .eq('id', id);

        if (error) {
            logError(error, 'updateCustomer');
            throw error;
        }
    });
};
