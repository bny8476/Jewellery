import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
    MetalRate, Company, LoanType, JewelleryType, Scheme, BankMaster
} from '../types/pawnshop';
import { handleApiError, logError } from '../utils/errorHandler';

// ============================================
// METAL RATES
// ============================================

export const getMetalRates = async (): Promise<MetalRate[]> => {
    if (!isSupabaseConfigured) {
        return [];
    }
    return handleApiError(async () => {
        const { data, error } = await supabase
            .from('metal_rates')
            .select('*')
            .order('effective_date', { ascending: false })
            .limit(10);

        if (error) {
            logError(error, 'getMetalRates');
            throw error;
        }
        return data || [];
    });
};

export const getCurrentMetalRates = async (): Promise<{ gold: number; silver: number }> => {
    if (!isSupabaseConfigured) {
        return { gold: 0, silver: 0 };
    }
    return handleApiError(async () => {
        const today = new Date().toISOString().split('T')[0];

        // 1. Try to fetch today's rate
        const { data: todayData, error: todayError } = await supabase
            .from('metal_rates')
            .select('*')
            .eq('effective_date', today);

        if (!todayError && todayData && todayData.length > 0) {
            const gold = todayData.find(r => r.metal_type === 'gold')?.rate_per_gram || 0;
            const silver = todayData.find(r => r.metal_type === 'silver')?.rate_per_gram || 0;
            if (gold > 0 || silver > 0) {
                return { gold, silver };
            }
        }

        // 2. Fallback: retrieve the most recent recorded rates
        const { data: recentData, error: recentError } = await supabase
            .from('metal_rates')
            .select('*')
            .order('effective_date', { ascending: false })
            .limit(10);

        if (recentError) {
            logError(recentError, 'getCurrentMetalRates');
            throw recentError;
        }

        const gold = recentData?.find(r => r.metal_type === 'gold')?.rate_per_gram || 0;
        const silver = recentData?.find(r => r.metal_type === 'silver')?.rate_per_gram || 0;

        return { gold, silver };
    });
};

export const updateMetalRate = async (metalType: 'gold' | 'silver', rate: number): Promise<void> => {
    if (!isSupabaseConfigured) {
        return;
    }
    return handleApiError(async () => {
        if (rate <= 0) {
            throw new Error('Rate must be a positive number');
        }

        const today = new Date().toISOString().split('T')[0];

        const { error } = await supabase
            .from('metal_rates')
            .upsert({
                metal_type: metalType,
                rate_per_gram: rate,
                effective_date: today
            }, {
                onConflict: 'metal_type,effective_date'
            });

        if (error) {
            logError(error, 'updateMetalRate');
            throw error;
        }
    });
};

// ============================================
// MASTER DATA - COMPANIES
// ============================================

export const getCompanies = async (): Promise<Company[]> => {
    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const createCompany = async (company: Partial<Company>): Promise<Company> => {
    const { data, error } = await supabase
        .from('companies')
        .insert(company)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateCompany = async (id: string, company: Partial<Company>): Promise<void> => {
    const { error } = await supabase
        .from('companies')
        .update(company)
        .eq('id', id);

    if (error) throw error;
};

export const deleteCompany = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// ============================================
// MASTER DATA - LOAN TYPES
// ============================================

export const getLoanTypes = async (): Promise<LoanType[]> => {
    const { data, error } = await supabase
        .from('loan_types')
        .select('*')
        .eq('is_active', true)
        .order('loan_type_name');

    if (error) throw error;
    return data || [];
};

export const createLoanType = async (loanType: Partial<LoanType>): Promise<LoanType> => {
    const { data, error } = await supabase
        .from('loan_types')
        .insert(loanType)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateLoanType = async (id: string, loanType: Partial<LoanType>): Promise<void> => {
    const { error } = await supabase
        .from('loan_types')
        .update(loanType)
        .eq('id', id);

    if (error) throw error;
};

export const deleteLoanType = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('loan_types')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// ============================================
// MASTER DATA - JEWELLERY TYPES
// ============================================

export const getJewelleryTypes = async (): Promise<JewelleryType[]> => {
    const { data, error } = await supabase
        .from('jewellery_types')
        .select('*')
        .eq('is_active', true)
        .order('jewellery_type_name');

    if (error) throw error;
    return data || [];
};

export const createJewelleryType = async (jewelleryType: Partial<JewelleryType>): Promise<JewelleryType> => {
    const { data, error } = await supabase
        .from('jewellery_types')
        .insert(jewelleryType)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateJewelleryType = async (id: string, jewelleryType: Partial<JewelleryType>): Promise<void> => {
    const { error } = await supabase
        .from('jewellery_types')
        .update(jewelleryType)
        .eq('id', id);

    if (error) throw error;
};

export const deleteJewelleryType = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('jewellery_types')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// ============================================
// MASTER DATA - SCHEMES
// ============================================

export const getSchemes = async (): Promise<Scheme[]> => {
    const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .eq('is_active', true)
        .order('scheme_name');

    if (error) throw error;
    return data || [];
};

export const createScheme = async (scheme: Partial<Scheme>): Promise<Scheme> => {
    const { data, error } = await supabase
        .from('schemes')
        .insert(scheme)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateScheme = async (id: string, scheme: Partial<Scheme>): Promise<void> => {
    const { error } = await supabase
        .from('schemes')
        .update(scheme)
        .eq('id', id);

    if (error) throw error;
};

export const deleteScheme = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('schemes')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// ============================================
// MASTER DATA - BANKS
// ============================================

export const getBanks = async (): Promise<BankMaster[]> => {
    const { data, error } = await supabase
        .from('bank_master')
        .select('*')
        .eq('is_active', true)
        .order('bank_name');

    if (error) throw error;
    return data || [];
};

export const createBank = async (bank: Partial<BankMaster>): Promise<BankMaster> => {
    const { data, error } = await supabase
        .from('bank_master')
        .insert(bank)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateBank = async (id: string, bank: Partial<BankMaster>): Promise<void> => {
    const { error } = await supabase
        .from('bank_master')
        .update(bank)
        .eq('id', id);

    if (error) throw error;
};

export const deleteBank = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('bank_master')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
