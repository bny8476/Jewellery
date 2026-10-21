import React, { useState, useEffect } from 'react';
import { Save, Printer, Plus } from 'lucide-react';
import { getPledges, getPledgeById, createAdditionalPledge } from '../../services/pawnshopService';
import { generateAdditionalPledgeReceipt } from '../../utils/receiptUtils';
import type { Pledge, AdditionalPledge } from '../../types/pawnshop';
import { toast } from '../../utils/toast';
import { validateRequired, validatePositiveNumber } from '../../utils/validation';

interface AdditionalPledgeFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const AdditionalPledgeForm: React.FC<AdditionalPledgeFormProps> = ({ onSuccess, onCancel }) => {
    const [pledges, setPledges] = useState<Pledge[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastAdditionalPledge, setLastAdditionalPledge] = useState<AdditionalPledge | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState({
        original_pledge_id: '',
        additional_date: new Date().toISOString().split('T')[0],
        additional_weight_grams: 0,
        additional_amount: 0,
        notes: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadActivePledges();
    }, []);

    useEffect(() => {
        if (formData.original_pledge_id) {
            loadPledgeDetails(formData.original_pledge_id);
        } else {
            setSelectedPledge(null);
        }
    }, [formData.original_pledge_id]);

    const loadActivePledges = async () => {
        try {
            const data = await getPledges('active');
            const partiallyPaid = await getPledges('partially_paid');
            setPledges([...data, ...partiallyPaid]);
        } catch (error: any) {
            toast.error('Failed to load pledges');
            console.error('Error loading pledges:', error);
        }
    };

    const loadPledgeDetails = async (pledgeId: string) => {
        try {
            const pledge = await getPledgeById(pledgeId);
            setSelectedPledge(pledge);
        } catch (error: any) {
            toast.error('Failed to load pledge details');
            console.error('Error loading pledge details:', error);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!validateRequired(formData.original_pledge_id)) {
            newErrors.original_pledge_id = 'Original pledge is required';
        }

        if (!validateRequired(formData.additional_date)) {
            newErrors.additional_date = 'Additional date is required';
        }

        if (!validatePositiveNumber(formData.additional_weight_grams)) {
            newErrors.additional_weight_grams = 'Weight must be a positive number';
        }

        if (!validatePositiveNumber(formData.additional_amount)) {
            newErrors.additional_amount = 'Amount must be a positive number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setLoading(true);
        try {
            const newAdditionalPledge = await createAdditionalPledge({
                original_pledge_id: formData.original_pledge_id,
                additional_date: formData.additional_date,
                additional_weight_grams: formData.additional_weight_grams,
                additional_amount: formData.additional_amount,
                notes: formData.notes || undefined
            });

            toast.success('Additional pledge added successfully');
            setLastAdditionalPledge(newAdditionalPledge);
            setShowSuccess(true);

            if (onSuccess) onSuccess();

            // Reset form
            setFormData({
                original_pledge_id: '',
                additional_date: new Date().toISOString().split('T')[0],
                additional_weight_grams: 0,
                additional_amount: 0,
                notes: ''
            });
            // Keep selectedPledge for printing context if needed, but receipt usually needs original pledge data which we have in selectedPledge
            setErrors({});
        } catch (error: any) {
            toast.error(error.message || 'Failed to add additional pledge');
            console.error('Error adding additional pledge:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReceipt = () => {
        if (!lastAdditionalPledge || !selectedPledge) return;
        try {
            generateAdditionalPledgeReceipt(lastAdditionalPledge, selectedPledge);
        } catch (error) {
            console.error('Error printing receipt:', error);
            toast.error('Failed to generate receipt');
        }
    };

    const handleNewAdditional = () => {
        setShowSuccess(false);
        setLastAdditionalPledge(null);
        setSelectedPledge(null);
    };

    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                    <Save className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">Additional Pledge Added!</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={handlePrintReceipt}
                        className="flex items-center space-x-2 px-6 py-3 bg-[var(--gold-primary)] text-black rounded-xl hover:opacity-90 font-semibold text-xs transition-opacity shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        <span>Print Receipt</span>
                    </button>
                    <button
                        onClick={handleNewAdditional}
                        className="flex items-center space-x-2 px-6 py-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl hover:border-[var(--gold-primary)] font-semibold text-xs transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Another</span>
                    </button>
                </div>
                {onCancel && (
                    <button onClick={onCancel} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-main)] underline mt-2">
                        Back to Dashboard
                    </button>
                )}
            </div>
        );
    }

    const filteredPledges = pledges.filter(pledge => {
        const customer = (pledge as any).customer;
        const customerName = customer?.full_name || '';
        const pledgeNumber = pledge.pledge_number || '';
        return (
            pledgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Pledge Selection */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Original Pledge * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Search by pledge number or customer name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                    />
                    <select
                        value={formData.original_pledge_id}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, original_pledge_id: e.target.value }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.original_pledge_id;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.original_pledge_id ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    >
                        <option value="">Select Original Pledge</option>
                        {filteredPledges.map((pledge) => {
                            const customer = (pledge as any).customer;
                            return (
                                <option key={pledge.id} value={pledge.id}>
                                    {pledge.pledge_number} - {customer?.full_name || 'Unknown'} - ₹{pledge.loan_amount.toLocaleString()}
                                </option>
                            );
                        })}
                    </select>
                    {errors.original_pledge_id && (
                        <p className="text-red-500 text-sm mt-1">{errors.original_pledge_id}</p>
                    )}
                    {selectedPledge && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-gray-700">
                                <strong>Current Weight:</strong> {selectedPledge.total_weight_grams.toLocaleString()}g |
                                <strong> Current Value:</strong> ₹{selectedPledge.appraised_value.toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Additional Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Date * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.additional_date}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, additional_date: e.target.value }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.additional_date;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.additional_date ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.additional_date && (
                        <p className="text-red-500 text-sm mt-1">{errors.additional_date}</p>
                    )}
                </div>

                {/* Additional Weight */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Weight (grams) * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.additional_weight_grams || ''}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, additional_weight_grams: parseFloat(e.target.value) || 0 }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.additional_weight_grams;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.additional_weight_grams ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.additional_weight_grams && (
                        <p className="text-red-500 text-sm mt-1">{errors.additional_weight_grams}</p>
                    )}
                </div>

                {/* Additional Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Amount * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.additional_amount || ''}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, additional_amount: parseFloat(e.target.value) || 0 }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.additional_amount;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.additional_amount ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.additional_amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.additional_amount}</p>
                    )}
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Additional notes..."
                    />
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Adding...' : 'Add Additional Pledge'}</span>
                </button>
            </div>
        </form>
    );
};

export default AdditionalPledgeForm;
