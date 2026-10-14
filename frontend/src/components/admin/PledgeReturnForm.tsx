import React, { useState, useEffect } from 'react';
import { Save, X, Printer, Plus } from 'lucide-react';
import { createPledgeReturn, getPledges, getPledgeById } from '../../services/pawnshopService';
import { generatePledgeReturnReceipt } from '../../utils/receiptUtils';
import { calculateInterest } from '../../utils/calculations';
import type { Pledge, PledgeReturn } from '../../types/pawnshop';
import { toast } from '../../utils/toast';
import { validateRequired, validatePositiveNumber } from '../../utils/validation';

interface PledgeReturnFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const PledgeReturnForm: React.FC<PledgeReturnFormProps> = ({ onSuccess, onCancel }) => {
    const [pledges, setPledges] = useState<Pledge[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [calculating, setCalculating] = useState(false);
    const [lastReturn, setLastReturn] = useState<PledgeReturn | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState({
        pledge_id: '',
        return_date: new Date().toISOString().split('T')[0],
        principal_amount: 0,
        interest_amount: 0,
        penalty_amount: 0,
        total_amount: 0,
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
            loadPledgeDetails(formData.pledge_id);
        } else {
            setSelectedPledge(null);
        }
    }, [formData.pledge_id]);

    useEffect(() => {
        // Auto-calculate total
        const total = formData.principal_amount + formData.interest_amount + formData.penalty_amount;
        setFormData(prev => ({ ...prev, total_amount: total }));
    }, [formData.principal_amount, formData.interest_amount, formData.penalty_amount]);

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

    // Recalculate interest when parameters change
    useEffect(() => {
        if (selectedPledge && formData.return_date) {
            calculateAndSetInterest();
        }
    }, [formData.return_date, selectedPledge]);

    const calculateAndSetInterest = () => {
        if (!selectedPledge) return;

        const interest = calculateInterest({
            principal: selectedPledge.loan_amount,
            rate: selectedPledge.interest_rate,
            startDate: selectedPledge.pledge_date,
            endDate: formData.return_date,
            interestType: (selectedPledge.interest_type as any) || 'monthly' // Default to monthly if missing
        });

        setFormData(prev => ({
            ...prev,
            interest_amount: interest
        }));
    };

    const loadPledgeDetails = async (pledgeId: string) => {
        try {
            setCalculating(true);
            const pledge = await getPledgeById(pledgeId);
            setSelectedPledge(pledge);

            // Pre-fill principal amount with loan amount
            setFormData(prev => ({
                ...prev,
                principal_amount: pledge.loan_amount || 0
            }));

        } catch (error: any) {
            toast.error('Failed to load pledge details');
            console.error('Error loading pledge details:', error);
        } finally {
            setCalculating(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!validateRequired(formData.pledge_id)) {
            newErrors.pledge_id = 'Pledge is required';
        }

        if (!validateRequired(formData.return_date)) {
            newErrors.return_date = 'Return date is required';
        }

        if (!validatePositiveNumber(formData.principal_amount)) {
            newErrors.principal_amount = 'Principal amount must be a positive number';
        }

        if (!validatePositiveNumber(formData.total_amount)) {
            newErrors.total_amount = 'Total amount must be a positive number';
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
            const pledgeReturn = await createPledgeReturn({
                pledge_id: formData.pledge_id,
                return_date: formData.return_date,
                principal_amount: formData.principal_amount,
                interest_amount: formData.interest_amount,
                penalty_amount: formData.penalty_amount,
                total_amount: formData.total_amount,
                payment_mode: formData.payment_mode,
                receipt_number: formData.receipt_number || undefined,
                notes: formData.notes || undefined
            });

            toast.success('Pledge returned successfully');
            setLastReturn(pledgeReturn);
            setShowSuccess(true);

            if (onSuccess) onSuccess();

            // Reset form
            setFormData({
                pledge_id: '',
                return_date: new Date().toISOString().split('T')[0],
                principal_amount: 0,
                interest_amount: 0,
                penalty_amount: 0,
                total_amount: 0,
                payment_mode: 'cash',
                receipt_number: '',
                notes: ''
            });
            // Keep selectedPledge for printing
            setErrors({});
        } catch (error: any) {
            toast.error(error.message || 'Failed to return pledge');
            console.error('Error returning pledge:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReceipt = () => {
        if (!lastReturn || !selectedPledge) return;
        try {
            generatePledgeReturnReceipt(lastReturn, selectedPledge);
        } catch (error) {
            console.error('Error printing receipt:', error);
            toast.error('Failed to generate receipt');
        }
    };

    const handleNewReturn = () => {
        setShowSuccess(false);
        setLastReturn(null);
        setSelectedPledge(null);
    };

    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 bg-white rounded-lg shadow-sm">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Save className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Pledge Returned Successfully!</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={handlePrintReceipt}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Printer className="h-5 w-5" />
                        <span>Print Receipt</span>
                    </button>
                    <button
                        onClick={handleNewReturn}
                        className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Return Another</span>
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
                        disabled={calculating}
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
                                <strong> Interest Rate:</strong> {selectedPledge.interest_rate}% {selectedPledge.interest_type} |
                                <strong> Status:</strong> {selectedPledge.status}
                            </p>
                        </div>
                    )}
                    {calculating && (
                        <p className="text-sm text-blue-600 mt-1">Calculating interest...</p>
                    )}
                </div>

                {/* Return Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Return Date * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.return_date}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, return_date: e.target.value }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.return_date;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.return_date ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.return_date && (
                        <p className="text-red-500 text-sm mt-1">{errors.return_date}</p>
                    )}
                </div>

                {/* Principal Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Principal Amount * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.principal_amount || ''}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, principal_amount: parseFloat(e.target.value) || 0 }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.principal_amount;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.principal_amount ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.principal_amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.principal_amount}</p>
                    )}
                </div>

                {/* Interest Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interest Amount</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.interest_amount || ''}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, interest_amount: parseFloat(e.target.value) || 0 }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Penalty Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Amount</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.penalty_amount || ''}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, penalty_amount: parseFloat(e.target.value) || 0 }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Total Amount (Auto-calculated) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Amount * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.total_amount || ''}
                        readOnly
                        className={`w-full px-3 py-2 border rounded-md bg-gray-50 ${errors.total_amount ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.total_amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.total_amount}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Auto-calculated: Principal + Interest + Penalty</p>
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
                    disabled={loading || calculating}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Processing...' : 'Return Pledge'}</span>
                </button>
            </div>
        </form>
    );
};

export default PledgeReturnForm;
