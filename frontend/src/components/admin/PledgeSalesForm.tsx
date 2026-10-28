import React, { useState, useEffect } from 'react';
import { Save, Printer, Plus } from 'lucide-react';
import { createPledgeSale, getPledges, getPledgeById } from '../../services/pawnshopService';
import { generatePledgeSaleReceipt } from '../../utils/receiptUtils';
import type { Pledge, PledgeSale } from '../../types/pawnshop';
import { toast } from '../../utils/toast';
import { validateRequired, validatePositiveNumber } from '../../utils/validation';

interface PledgeSalesFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const PledgeSalesForm: React.FC<PledgeSalesFormProps> = ({ onSuccess, onCancel }) => {
    const [pledges, setPledges] = useState<Pledge[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastSale, setLastSale] = useState<PledgeSale | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState({
        pledge_id: '',
        sale_date: new Date().toISOString().split('T')[0],
        sale_amount: 0,
        buyer_name: '',
        buyer_phone: '',
        payment_mode: 'cash' as 'cash' | 'upi' | 'card' | 'bank_transfer',
        notes: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadActivePledges();
    }, []);

    useEffect(() => {
        if (formData.pledge_id) {
            loadPledgeDetails(formData.pledge_id);
        } else {
            setSelectedPledge(null);
        }
    }, [formData.pledge_id]);

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

        if (!validateRequired(formData.pledge_id)) {
            newErrors.pledge_id = 'Pledge is required';
        }

        if (!validateRequired(formData.sale_date)) {
            newErrors.sale_date = 'Sale date is required';
        }

        if (!validatePositiveNumber(formData.sale_amount)) {
            newErrors.sale_amount = 'Sale amount must be a positive number';
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

        if (!window.confirm('Are you sure you want to sell this pledge? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            const sale = await createPledgeSale({
                pledge_id: formData.pledge_id,
                sale_date: formData.sale_date,
                sale_amount: formData.sale_amount,
                buyer_name: formData.buyer_name || undefined,
                buyer_phone: formData.buyer_phone || undefined,
                payment_mode: formData.payment_mode,
                notes: formData.notes || undefined
            });

            toast.success('Pledge sold successfully');
            setLastSale(sale);
            setShowSuccess(true);

            if (onSuccess) onSuccess();

            // Reset form
            setFormData({
                pledge_id: '',
                sale_date: new Date().toISOString().split('T')[0],
                sale_amount: 0,
                buyer_name: '',
                buyer_phone: '',
                payment_mode: 'cash',
                notes: ''
            });
            // Keep selectedPledge for printing
            setErrors({});
        } catch (error: any) {
            toast.error(error.message || 'Failed to sell pledge');
            console.error('Error selling pledge:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReceipt = () => {
        if (!lastSale || !selectedPledge) return;
        try {
            generatePledgeSaleReceipt(lastSale, selectedPledge);
        } catch (error) {
            console.error('Error printing receipt:', error);
            toast.error('Failed to generate receipt');
        }
    };

    const handleNewSale = () => {
        setShowSuccess(false);
        setLastSale(null);
        setSelectedPledge(null);
    };

    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                    <Save className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">Pledge Sold Successfully!</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={handlePrintReceipt}
                        className="flex items-center space-x-2 px-6 py-3 bg-[var(--gold-primary)] text-black rounded-xl hover:opacity-90 font-semibold text-xs transition-opacity shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        <span>Print Receipt</span>
                    </button>
                    <button
                        onClick={handleNewSale}
                        className="flex items-center space-x-2 px-6 py-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl hover:border-[var(--gold-primary)] font-semibold text-xs transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Sell Another</span>
                    </button>
                </div>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-main)] underline mt-2">
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Selling a pledge will change its status to 'sold' and cannot be reversed. Please ensure all details are correct.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pledge Selection */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Pledge to Sell * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Search by pledge number or customer name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                    />
                    <select
                        value={formData.pledge_id}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, pledge_id: e.target.value }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.pledge_id;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.pledge_id ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    >
                        <option value="">Select Pledge</option>
                        {filteredPledges.map((pledge) => {
                            const customer = (pledge as any).customer;
                            return (
                                <option key={pledge.id} value={pledge.id}>
                                    {pledge.pledge_number} - {customer?.full_name || 'Unknown'} - ₹{pledge.loan_amount.toLocaleString()}
                                </option>
                            );
                        })}
                    </select>
                    {errors.pledge_id && (
                        <p className="text-red-500 text-sm mt-1">{errors.pledge_id}</p>
                    )}
                    {selectedPledge && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-gray-700">
                                <strong>Loan Amount:</strong> ₹{selectedPledge.loan_amount.toLocaleString()} |
                                <strong> Status:</strong> {selectedPledge.status}
                            </p>
                        </div>
                    )}
                </div>

                {/* Sale Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sale Date * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.sale_date}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, sale_date: e.target.value }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.sale_date;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.sale_date ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.sale_date && (
                        <p className="text-red-500 text-sm mt-1">{errors.sale_date}</p>
                    )}
                </div>

                {/* Sale Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sale Amount * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.sale_amount || ''}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, sale_amount: parseFloat(e.target.value) || 0 }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.sale_amount;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.sale_amount ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.sale_amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.sale_amount}</p>
                    )}
                </div>

                {/* Buyer Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
                    <input
                        type="text"
                        value={formData.buyer_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, buyer_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Optional"
                    />
                </div>

                {/* Buyer Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Phone</label>
                    <input
                        type="tel"
                        value={formData.buyer_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, buyer_phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Optional"
                    />
                </div>

                {/* Payment Mode */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                    <select
                        value={formData.payment_mode}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_mode: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                    </select>
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
                    className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Selling...' : 'Sell Pledge'}</span>
                </button>
            </div>
        </form>
    );
};

export default PledgeSalesForm;
