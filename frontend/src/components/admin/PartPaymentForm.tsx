import React, { useState, useEffect } from 'react';
import { Save, X, Printer, Plus } from 'lucide-react';
import { createPartPayment, getPledges } from '../../services/pawnshopService';
import { generatePaymentReceipt } from '../../utils/receiptUtils';
import type { Pledge, PartPayment } from '../../types/pawnshop';
import { toast } from '../../utils/toast';
import { validateRequired, validatePositiveNumber } from '../../utils/validation';

interface PartPaymentFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const PartPaymentForm: React.FC<PartPaymentFormProps> = ({ onSuccess, onCancel }) => {
    const [pledges, setPledges] = useState<Pledge[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastPayment, setLastPayment] = useState<PartPayment | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState({
        pledge_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_amount: 0,
        principal_paid: 0,
        interest_paid: 0,
        payment_mode: 'cash' as 'cash' | 'upi' | 'card' | 'bank_transfer',
        receipt_number: '',
        notes: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadActivePledges();
    }, []);

    useEffect(() => {
        if (formData.pledge_id) {
            const pledge = pledges.find(p => p.id === formData.pledge_id);
            setSelectedPledge(pledge || null);
        } else {
            setSelectedPledge(null);
        }
    }, [formData.pledge_id, pledges]);

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

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!validateRequired(formData.pledge_id)) {
            newErrors.pledge_id = 'Pledge is required';
        }

        if (!validateRequired(formData.payment_date)) {
            newErrors.payment_date = 'Payment date is required';
        }

        if (!validatePositiveNumber(formData.payment_amount)) {
            newErrors.payment_amount = 'Payment amount must be a positive number';
        }

        // Validate that principal + interest = payment amount (optional check)
        const totalAllocated = formData.principal_paid + formData.interest_paid;
        if (totalAllocated > formData.payment_amount) {
            newErrors.payment_amount = 'Principal + Interest cannot exceed payment amount';
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
            const payment = await createPartPayment({
                pledge_id: formData.pledge_id,
                payment_date: formData.payment_date,
                payment_amount: formData.payment_amount,
                principal_paid: formData.principal_paid || 0,
                interest_paid: formData.interest_paid || 0,
                payment_mode: formData.payment_mode,
                receipt_number: formData.receipt_number || undefined,
                notes: formData.notes || undefined
            });

            toast.success('Part payment recorded successfully');
            setLastPayment(payment);
            setShowSuccess(true);

            if (onSuccess) onSuccess();

            // Reset form
            setFormData({
                pledge_id: '',
                payment_date: new Date().toISOString().split('T')[0],
                payment_amount: 0,
                principal_paid: 0,
                interest_paid: 0,
                payment_mode: 'cash',
                receipt_number: '',
                notes: ''
            });
            // We keep selectedPledge for the receipt printing, then clear it on new payment
            setErrors({});
        } catch (error: any) {
            toast.error(error.message || 'Failed to record part payment');
            console.error('Error recording part payment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReceipt = () => {
        if (!lastPayment || !selectedPledge) return;
        try {
            generatePaymentReceipt(lastPayment, selectedPledge);
        } catch (error) {
            console.error('Error printing receipt:', error);
            toast.error('Failed to generate receipt');
        }
    };

    const handleNewPayment = () => {
        setShowSuccess(false);
        setLastPayment(null);
        setSelectedPledge(null);
    };

    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 bg-white rounded-lg shadow-sm">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Save className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Payment Recorded Successfully!</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={handlePrintReceipt}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Printer className="h-5 w-5" />
                        <span>Print Receipt</span>
                    </button>
                    <button
                        onClick={handleNewPayment}
                        className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Record Another</span>
                    </button>
                </div>
                {onCancel && (
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 underline mt-4">
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
                {/* Pledge Selection */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Pledge * <span className="text-red-500">*</span>
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

                {/* Payment Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Date * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, payment_date: e.target.value }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.payment_date;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.payment_date ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.payment_date && (
                        <p className="text-red-500 text-sm mt-1">{errors.payment_date}</p>
                    )}
                </div>

                {/* Payment Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Amount * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.payment_amount || ''}
                        onChange={(e) => {
                            const amount = parseFloat(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, payment_amount: amount }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.payment_amount;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.payment_amount ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.payment_amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.payment_amount}</p>
                    )}
                </div>

                {/* Principal Paid */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Principal Paid</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.principal_paid || ''}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, principal_paid: parseFloat(e.target.value) || 0 }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Interest Paid */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interest Paid</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.interest_paid || ''}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, interest_paid: parseFloat(e.target.value) || 0 }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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

                {/* Receipt Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                    <input
                        type="text"
                        value={formData.receipt_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, receipt_number: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Optional"
                    />
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
                    <span>{loading ? 'Recording...' : 'Record Payment'}</span>
                </button>
            </div>
        </form>
    );
};

export default PartPaymentForm;
