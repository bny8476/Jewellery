import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Printer, User, AlertOctagon, ShieldAlert } from 'lucide-react';
import { createPledge, getCustomers, getLoanTypes, getSchemes, getJewelleryTypes, getPledgeById, getPledges } from '../../services/pawnshopService';
import { generatePledgeReceipt } from '../../utils/receiptUtils';
import { generatePledgeNumber } from '../../utils/sequenceUtils';
import type { Customer, LoanType, Scheme, JewelleryType, PledgeItemFormData } from '../../types/pawnshop';
import { toast } from '../../utils/toast';
import { validateRequired, validatePositiveNumber } from '../../utils/validation';

import { supabase, PawnRequest } from '../../lib/supabase';

interface PledgeEntryFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialPawnRequest?: PawnRequest | null;
}

// Mock Blocked IDs for demonstration (in real app, this would be in DB)
const BLOCKED_ID_PROOFS = ['BLOCKED123', 'FRAUD999', 'ABC1234567'];

const PledgeEntryForm: React.FC<PledgeEntryFormProps> = ({ onSuccess, onCancel, initialPawnRequest }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [jewelleryTypes, setJewelleryTypes] = useState<JewelleryType[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchCustomer, setSearchCustomer] = useState('');
    const [lastPledgeId, setLastPledgeId] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Enhancements State
    const [generatedPledgeNo, setGeneratedPledgeNo] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isCustomerBlocked, setIsCustomerBlocked] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    const [formData, setFormData] = useState({
        customer_id: '',
        loan_type_id: '',
        scheme_id: '',
        pledge_date: new Date().toISOString().split('T')[0],
        loan_amount: 0,
        interest_rate: 0,
        interest_type: 'monthly' as 'monthly' | 'annual' | 'daily',
        document_charges: 0,
        notes: '',
        items: [] as PledgeItemFormData[]
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadInitialData();
        generateNextBillNumber();
    }, []);

    // Auto-fill interest rate from scheme
    useEffect(() => {
        if (formData.scheme_id) {
            const scheme = schemes.find(s => s.id === formData.scheme_id);
            if (scheme) {
                setFormData(prev => ({
                    ...prev,
                    interest_rate: scheme.interest_rate,
                    interest_type: scheme.interest_type
                }));
            }
        }
    }, [formData.scheme_id, schemes]);

    // Handle Initial Pawn Request (Online Request)
    useEffect(() => {
        if (initialPawnRequest) {
            setFormData(prev => ({
                ...prev,
                loan_amount: initialPawnRequest.requested_amount,
                notes: `Online Request: ${initialPawnRequest.item_description} (ID: ${initialPawnRequest.id})`,
                items: [{
                    item_description: initialPawnRequest.item_description,
                    gross_weight_grams: 0,
                    net_weight_grams: 0,
                    quantity: 1,
                    purity: '',
                    item_value: 0
                }]
            }));

            // Try to find customer if user_id exists and maps to a customer logic (omitted for now as we don't have direct mapping easily without profiles table being fully utilised in customers table)
        }
    }, [initialPawnRequest]);

    // Handle Customer Selection & Blocking Logic
    useEffect(() => {
        if (formData.customer_id) {
            const customer = customers.find(c => c.id === formData.customer_id);
            if (customer) {
                setSelectedCustomer(customer);

                // Check if blocked
                let blocked = customer.is_blocked || false;
                let reason = customer.block_reason || '';

                // Check ID Proof against Blocklist
                if (customer.id_proof_number && BLOCKED_ID_PROOFS.includes(customer.id_proof_number.toUpperCase())) {
                    blocked = true;
                    reason = 'ID Proof found in National Blocklist';
                }

                setIsCustomerBlocked(blocked);
                setBlockReason(reason || 'Customer is blocked by administration');

                if (blocked) {
                    toast.error('WARNING: This customer is BLOCKED!');
                }
            }
        } else {
            setSelectedCustomer(null);
            setIsCustomerBlocked(false);
            setBlockReason('');
        }
    }, [formData.customer_id, customers]);

    const loadInitialData = async () => {
        try {
            const [customersData, loanTypesData, schemesData, jewelleryTypesData] = await Promise.all([
                getCustomers(),
                getLoanTypes(),
                getSchemes(),
                getJewelleryTypes()
            ]);
            setCustomers(customersData);
            setLoanTypes(loanTypesData);
            setSchemes(schemesData);
            setJewelleryTypes(jewelleryTypesData);
        } catch (error: any) {
            toast.error('Failed to load initial data');
            console.error('Error loading initial data:', error);
        }
    };

    const generateNextBillNumber = async () => {
        try {
            // Fetch last pledge to determine next sequence
            const pledges = await getPledges();
            // In a real app we'd fetch just the last one sorted by id, but getPledges sorts by created_at desc
            const lastPledge = pledges.length > 0 ? pledges[0] : null;
            const nextNo = generatePledgeNumber(lastPledge?.pledge_number, 'PL'); // Assuming 'PL' as prefix, ideally from Company settings
            setGeneratedPledgeNo(nextNo);
        } catch (error) {
            console.error('Error generating bill number', error);
            setGeneratedPledgeNo('PL-' + new Date().getFullYear() + '-0001'); // Fallback
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    jewellery_type_id: '',
                    item_description: '',
                    gross_weight_grams: 0,
                    net_weight_grams: 0,
                    purity: '',
                    quantity: 1,
                    item_value: 0,
                    purity_test_value: '' // Initialize
                }
            ]
        }));
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItem = (index: number, field: keyof PledgeItemFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
        // Clear error for this field
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[`items.${index}.${field}`];
            return newErrors;
        });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (isCustomerBlocked) {
            newErrors.customer_id = 'Cannot create pledge for blocked customer';
        }

        if (!validateRequired(formData.customer_id)) {
            newErrors.customer_id = 'Customer is required';
        }

        if (!validateRequired(formData.pledge_date)) {
            newErrors.pledge_date = 'Pledge date is required';
        }

        if (!validatePositiveNumber(formData.loan_amount)) {
            newErrors.loan_amount = 'Loan amount must be a positive number';
        }

        if (!validatePositiveNumber(formData.interest_rate)) {
            newErrors.interest_rate = 'Interest rate must be a positive number';
        }

        if (formData.items.length === 0) {
            newErrors.items = 'At least one item is required';
        }

        // Validate items... (same as before)
        formData.items.forEach((item, index) => {
            if (!validateRequired(item.item_description)) newErrors[`items.${index}.item_description`] = 'Required';
            if (!validatePositiveNumber(item.gross_weight_grams)) newErrors[`items.${index}.gross_weight_grams`] = 'Invalid weight';
            if (!validatePositiveNumber(item.net_weight_grams)) newErrors[`items.${index}.net_weight_grams`] = 'Invalid weight';
            if (item.net_weight_grams > item.gross_weight_grams) newErrors[`items.${index}.net_weight_grams`] = 'Net > Gross';
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        if (isCustomerBlocked) {
            toast.error('Action blocked: Customer is in blocklist');
            return;
        }

        setLoading(true);
        try {
            const newPledge = await createPledge({
                customer_id: formData.customer_id,
                loan_type_id: formData.loan_type_id || undefined,
                scheme_id: formData.scheme_id || undefined,
                pledge_date: formData.pledge_date,
                loan_amount: formData.loan_amount,
                interest_rate: formData.interest_rate,
                interest_type: formData.interest_type,
                document_charges: formData.document_charges,
                pledge_number: generatedPledgeNo, // Using the custom generated number
                notes: formData.notes || undefined,
                items: formData.items
            });

            // UPDATE online request status if applicable
            if (initialPawnRequest) {
                console.log('Updating pawn request status to approved for ID:', initialPawnRequest.id);
                const { error: updateError } = await supabase
                    .from('pawn_requests')
                    .update({ status: 'approved' })
                    .eq('id', initialPawnRequest.id);

                if (updateError) {
                    console.error('Error updating pawn request status:', updateError);
                    toast.warning('Pledge created, but failed to update online request status.');
                } else {
                    console.log('Successfully updated online request status');
                }
            }

            toast.success(`Pledge ${newPledge.pledge_number} created successfully`);
            setLastPledgeId(newPledge.id);
            setShowSuccess(true);

            if (onSuccess) onSuccess();

            // Reset form
            setFormData({
                customer_id: '',
                loan_type_id: '',
                scheme_id: '',
                pledge_date: new Date().toISOString().split('T')[0],
                loan_amount: 0,
                interest_rate: 0,
                interest_type: 'monthly',
                document_charges: 0,
                notes: '',
                items: []
            });
            setSelectedCustomer(null);
            setIsCustomerBlocked(false);
            setErrors({});
            // Regenerate next number
            generateNextBillNumber();

        } catch (error: any) {
            toast.error(error.message || 'Failed to create pledge');
            console.error('Error creating pledge:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReceipt = async () => {
        if (!lastPledgeId) return;
        try {
            const pledgeDetails = await getPledgeById(lastPledgeId);
            generatePledgeReceipt(pledgeDetails as any);
        } catch (error) {
            console.error('Error printing receipt:', error);
            toast.error('Failed to generate receipt');
        }
    };

    const handleNewPledge = () => {
        setShowSuccess(false);
        setLastPledgeId(null);
    };

    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 bg-white rounded-lg shadow-sm">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Save className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Pledge Created Successfully!</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={handlePrintReceipt}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Printer className="h-5 w-5" />
                        <span>Print Receipt</span>
                    </button>
                    <button
                        onClick={handleNewPledge}
                        className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Create Another</span>
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

    const filteredCustomers = customers.filter(customer =>
        (customer.full_name || '').toLowerCase().includes(searchCustomer.toLowerCase()) ||
        (customer.phone || '').includes(searchCustomer) ||
        (customer.customer_code || '').toLowerCase().includes(searchCustomer.toLowerCase())
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Bill Number Header */}
            <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center border border-gray-200">
                <div>
                    <span className="text-gray-500 text-sm uppercase font-semibold">Bill Sequence Number</span>
                    <h2 className="text-2xl font-bold text-gray-800">{generatedPledgeNo || 'Loading...'}</h2>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">Date:</span>
                    <span className="font-medium text-gray-900">{new Date(formData.pledge_date).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Selection */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Search by name, phone, or code..."
                        value={searchCustomer}
                        onChange={(e) => setSearchCustomer(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                    />
                    <select
                        value={formData.customer_id}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, customer_id: e.target.value }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.customer_id;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.customer_id ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    >
                        <option value="">Select Customer</option>
                        {filteredCustomers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                                {customer.customer_code} - {customer.full_name} ({customer.phone})
                            </option>
                        ))}
                    </select>
                    {errors.customer_id && (
                        <p className="text-red-500 text-sm mt-1">{errors.customer_id}</p>
                    )}
                </div>

                {/* Customer Details Card */}
                {selectedCustomer && (
                    <div className={`md:col-span-2 p-4 rounded-lg border flex items-start space-x-4 transition-all duration-300 ${isCustomerBlocked ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-200'
                        }`}>
                        {/* User Image / Avatar */}
                        <div className="flex-shrink-0">
                            {selectedCustomer.photo_url ? (
                                <img
                                    src={selectedCustomer.photo_url}
                                    alt="Customer"
                                    className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                            ) : (
                                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isCustomerBlocked ? 'bg-red-200' : 'bg-blue-200'
                                    }`}>
                                    <User className={`h-8 w-8 ${isCustomerBlocked ? 'text-red-600' : 'text-blue-600'}`} />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{selectedCustomer.full_name}</h3>
                                    <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                                </div>
                                {isCustomerBlocked && (
                                    <div className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold animate-pulse">
                                        <ShieldAlert className="w-4 h-4 mr-1" />
                                        BLOCKED
                                    </div>
                                )}
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <div>
                                    <span className="text-gray-500">Gender:</span>
                                    <span className="ml-1 font-medium capitalize">{selectedCustomer.gender || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Code:</span>
                                    <span className="ml-1 font-medium">{selectedCustomer.customer_code}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500">Address:</span>
                                    <span className="ml-1 text-gray-800">{selectedCustomer.address}, {selectedCustomer.city}</span>
                                </div>
                            </div>

                            {isCustomerBlocked && (
                                <div className="mt-3 p-2 bg-red-100 text-red-800 text-sm rounded border border-red-200 flex items-center">
                                    <AlertOctagon className="w-4 h-4 mr-2" />
                                    <span>Reason: {blockReason}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Loan Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
                    <select
                        value={formData.loan_type_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, loan_type_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Select Loan Type</option>
                        {loanTypes.map((loanType) => (
                            <option key={loanType.id} value={loanType.id}>
                                {loanType.loan_type_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Scheme */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheme</label>
                    <select
                        value={formData.scheme_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheme_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Select Scheme</option>
                        {schemes.map((scheme) => (
                            <option key={scheme.id} value={scheme.id}>
                                {scheme.scheme_name} ({scheme.interest_rate}% {scheme.interest_type})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Pledge Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pledge Date * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.pledge_date}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, pledge_date: e.target.value }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.pledge_date;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.pledge_date ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.pledge_date && (
                        <p className="text-red-500 text-sm mt-1">{errors.pledge_date}</p>
                    )}
                </div>

                {/* Loan Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loan Amount * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.loan_amount || ''}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, loan_amount: parseFloat(e.target.value) || 0 }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.loan_amount;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.loan_amount ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.loan_amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.loan_amount}</p>
                    )}
                </div>

                {/* Interest Rate */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interest Rate (%) * <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.interest_rate || ''}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }));
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.interest_rate;
                                return newErrors;
                            });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.interest_rate ? 'border-red-500' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.interest_rate && (
                        <p className="text-red-500 text-sm mt-1">{errors.interest_rate}</p>
                    )}
                </div>

                {/* Interest Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interest Type *</label>
                    <select
                        value={formData.interest_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, interest_type: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                    >
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                        <option value="daily">Daily</option>
                    </select>
                </div>

                {/* Document Charges */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Charges (DC)</label>
                    <input
                        type="number"
                        min="0"
                        value={formData.document_charges || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, document_charges: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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

            {/* Items Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Items * <span className="text-red-500">*</span>
                    </label>
                    <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Item</span>
                    </button>
                </div>
                {errors.items && (
                    <p className="text-red-500 text-sm mb-2">{errors.items}</p>
                )}

                <div className="space-y-4">
                    {formData.items.map((item, index) => (
                        <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                                {formData.items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Jewellery Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jewellery Type</label>
                                    <select
                                        value={item.jewellery_type_id || ''}
                                        onChange={(e) => updateItem(index, 'jewellery_type_id', e.target.value || undefined)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Select Type</option>
                                        {jewelleryTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.jewellery_type_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Item Description */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description * <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={item.item_description}
                                        onChange={(e) => updateItem(index, 'item_description', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors[`items.${index}.item_description`] ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        required
                                    />
                                    {errors[`items.${index}.item_description`] && (
                                        <p className="text-red-500 text-sm mt-1">{errors[`items.${index}.item_description`]}</p>
                                    )}
                                </div>

                                {/* Gross Weight */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gross Weight (g) * <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.gross_weight_grams || ''}
                                        onChange={(e) => updateItem(index, 'gross_weight_grams', parseFloat(e.target.value) || 0)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors[`items.${index}.gross_weight_grams`] ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        required
                                    />
                                    {errors[`items.${index}.gross_weight_grams`] && (
                                        <p className="text-red-500 text-sm mt-1">{errors[`items.${index}.gross_weight_grams`]}</p>
                                    )}
                                </div>

                                {/* Net Weight */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Net Weight (g) * <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.net_weight_grams || ''}
                                        onChange={(e) => updateItem(index, 'net_weight_grams', parseFloat(e.target.value) || 0)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors[`items.${index}.net_weight_grams`] ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        required
                                    />
                                    {errors[`items.${index}.net_weight_grams`] && (
                                        <p className="text-red-500 text-sm mt-1">{errors[`items.${index}.net_weight_grams`]}</p>
                                    )}
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity || 1}
                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                {/* Purity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
                                    <input
                                        type="text"
                                        value={item.purity || ''}
                                        onChange={(e) => updateItem(index, 'purity', e.target.value || undefined)}
                                        placeholder="e.g., 22K, 18K"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                {/* Touch / Purity Test (Phase 2) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Touch / Test</label>
                                    <input
                                        type="text"
                                        value={item.purity_test_value || ''}
                                        onChange={(e) => updateItem(index, 'purity_test_value', e.target.value)}
                                        placeholder="e.g. 916, 75"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                {/* Item Value */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Value (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.item_value || ''}
                                        onChange={(e) => updateItem(index, 'item_value', parseFloat(e.target.value) || undefined)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {formData.items.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500">No items added. Click "Add Item" to add items to this pledge.</p>
                    </div>
                )}
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
                    disabled={loading || isCustomerBlocked}
                    className={`flex items-center space-x-2 px-6 py-2 rounded-md transition-colors ${isCustomerBlocked
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                >
                    {isCustomerBlocked ? <ShieldAlert className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    <span>{isCustomerBlocked ? 'Blocked' : loading ? 'Creating...' : 'Create Pledge'}</span>
                </button>
            </div>
        </form>
    );
};

export default PledgeEntryForm;
