import React, { useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import { cancelTransaction } from '../../services/pawnshopService';
import { toast } from '../../utils/toast';
import { validateRequired } from '../../utils/validation';

interface CancelTransactionFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const CancelTransactionForm: React.FC<CancelTransactionFormProps> = ({ onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        transaction_type: '',
        transaction_id: '',
        cancellation_date: new Date().toISOString().split('T')[0],
        reason: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const transactionTypes = [
        { value: 'pledge', label: 'Pledge' },
        { value: 'part_payment', label: 'Part Payment' },
        { value: 'pledge_return', label: 'Pledge Return' },
        { value: 'additional_pledge', label: 'Additional Pledge' },
        { value: 'pledge_sale', label: 'Pledge Sale' },
        { value: 'bank_pledge', label: 'Bank Pledge' },
        { value: 'cash_transaction', label: 'Cash Transaction' }
    ];

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!validateRequired(formData.transaction_type)) {
            newErrors.transaction_type = 'Transaction type is required';
        }

        if (!validateRequired(formData.transaction_id)) {
            newErrors.transaction_id = 'Transaction ID is required';
        }

        if (!validateRequired(formData.cancellation_date)) {
            newErrors.cancellation_date = 'Cancellation date is required';
        }

        if (!validateRequired(formData.reason)) {
            newErrors.reason = 'Reason is required';
        }

        if (formData.reason && formData.reason.length < 10) {
            newErrors.reason = 'Reason must be at least 10 characters';
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

        if (!window.confirm('Are you sure you want to cancel this transaction? This action will be recorded but the original transaction will remain in the system.')) {
            return;
        }

        setLoading(true);
        try {
            await cancelTransaction({
                transaction_type: formData.transaction_type,
                transaction_id: formData.transaction_id,
                cancellation_date: formData.cancellation_date,
                reason: formData.reason
            });

            toast.success('Transaction cancelled successfully');
            if (onSuccess) onSuccess();

            // Reset form
            setFormData({
                transaction_type: '',
                transaction_id: '',
                cancellation_date: new Date().toISOString().split('T')[0],
                reason: ''
            });
            setErrors({});
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel transaction');
            console.error('Error cancelling transaction:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                        <h3 className="text-sm font-semibold text-yellow-800 mb-1">Important Notice</h3>
                        <p className="text-sm text-yellow-700">
                            Cancelling a transaction records the cancellation but does not delete the original transaction. 
                            This is for audit purposes. The original transaction will remain in the system.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Transaction Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction Type * <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.transaction_type}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, transaction_type: e.target.value }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.transaction_type;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.transaction_type ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                    >
                        <option value="">Select Transaction Type</option>
                        {transactionTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    {errors.transaction_type && (
                        <p className="text-red-500 text-sm mt-1">{errors.transaction_type}</p>
                    )}
                </div>

                {/* Transaction ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction ID * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.transaction_id}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, transaction_id: e.target.value }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.transaction_id;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.transaction_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter transaction UUID"
                        required
                    />
                    {errors.transaction_id && (
                        <p className="text-red-500 text-sm mt-1">{errors.transaction_id}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Enter the UUID of the transaction to cancel</p>
                </div>

                {/* Cancellation Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cancellation Date * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.cancellation_date}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, cancellation_date: e.target.value }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.cancellation_date;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.cancellation_date ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                    />
                    {errors.cancellation_date && (
                        <p className="text-red-500 text-sm mt-1">{errors.cancellation_date}</p>
                    )}
                </div>

                {/* Reason */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cancellation Reason * <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.reason}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, reason: e.target.value }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.reason;
                                return newErrors;
                            });
                        }}
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.reason ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter a detailed reason for cancellation (minimum 10 characters)"
                        required
                    />
                    {errors.reason && (
                        <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        {formData.reason.length}/10 minimum characters
                    </p>
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
                    <span>{loading ? 'Cancelling...' : 'Cancel Transaction'}</span>
                </button>
            </div>
        </form>
    );
};

export default CancelTransactionForm;
