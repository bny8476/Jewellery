import { supabase } from '../lib/supabase';
import type { Pledge, PledgeFormData } from '../types/pawnshop';
import { handleApiError, logError } from '../utils/errorHandler';
import { validateRequired, validatePositiveNumber } from '../utils/validation';

// ============================================
// PLEDGES
// ============================================

export const getPledges = async (status?: string): Promise<Pledge[]> => {
    return handleApiError(async () => {
        let query = supabase
            .from('pledges')
            .select(`
      *,
      customer:customers(*),
      scheme:schemes(*),
      loan_type:loan_types(*)
    `)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            logError(error, 'getPledges');
            throw error;
        }
        return data || [];
    });
};

export const getPledgeById = async (id: string): Promise<Pledge> => {
    return handleApiError(async () => {
        if (!id) {
            throw new Error('Pledge ID is required');
        }

        const { data, error } = await supabase
            .from('pledges')
            .select(`
      *,
      customer:customers(*),
      scheme:schemes(*),
      loan_type:loan_types(*),
      items:pledge_items(*)
    `)
            .eq('id', id)
            .single();

        if (error) {
            logError(error, 'getPledgeById');
            throw error;
        }
        return data;
    });
};

export const createPledge = async (pledgeData: PledgeFormData): Promise<Pledge> => {
    return handleApiError(async () => {
        const { items, ...pledge } = pledgeData;

        // Strict service-level validation
        if (!validateRequired(pledge.customer_id)) {
            throw new Error('Customer ID is required to create a pledge');
        }

        if (!validatePositiveNumber(pledge.loan_amount)) {
            throw new Error('Loan amount must be a positive number');
        }

        if (!validatePositiveNumber(pledge.interest_rate)) {
            throw new Error('Interest rate must be a positive number');
        }

        if (!items || items.length === 0) {
            throw new Error('At least one item is required for a pledge');
        }

        for (const item of items) {
            if (!validateRequired(item.item_description)) {
                throw new Error('Item description is required for every pledge item');
            }
            if (!validatePositiveNumber(item.gross_weight_grams)) {
                throw new Error(`Invalid gross weight for item: ${item.item_description}`);
            }
            if (!validatePositiveNumber(item.net_weight_grams)) {
                throw new Error(`Invalid net weight for item: ${item.item_description}`);
            }
            if (item.net_weight_grams > item.gross_weight_grams) {
                throw new Error(`Net weight cannot exceed gross weight for item: ${item.item_description}`);
            }
        }

        // Calculate totals
        const totalWeight = items.reduce((sum, item) => sum + item.gross_weight_grams, 0);
        const totalValue = items.reduce((sum, item) => sum + (item.item_value || 0), 0);

        // Step 1: Create pledge
        const { data: pledgeRecord, error: pledgeError } = await supabase
            .from('pledges')
            .insert({
                ...pledge,
                total_weight_grams: totalWeight,
                total_items: items.length,
                appraised_value: totalValue
            })
            .select()
            .single();

        if (pledgeError) {
            logError(pledgeError, 'createPledge - pledge creation');
            throw pledgeError;
        }

        if (!pledgeRecord) {
            throw new Error('Failed to create pledge');
        }

        // Step 2: Insert items
        const itemsWithPledgeId = items.map(item => ({
            ...item,
            pledge_id: pledgeRecord.id
        }));

        const { error: itemsError } = await supabase
            .from('pledge_items')
            .insert(itemsWithPledgeId);

        // Step 3: Rollback if items fail
        if (itemsError) {
            logError(itemsError, 'createPledge - items creation');
            // Rollback: Delete the pledge
            try {
                await supabase
                    .from('pledges')
                    .delete()
                    .eq('id', pledgeRecord.id);
            } catch (rollbackError) {
                logError(rollbackError, 'createPledge - rollback failed');
                // Log but don't throw - original error is more important
            }
            throw new Error(`Failed to create pledge items: ${itemsError.message}`);
        }

        return pledgeRecord;
    });
};
