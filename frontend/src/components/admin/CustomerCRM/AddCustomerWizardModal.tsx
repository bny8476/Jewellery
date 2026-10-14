import React, { useState, useEffect } from 'react';
import { 
  X, User, MapPin, ShieldCheck, HeartHandshake, CheckCircle2, 
  AlertCircle, ChevronRight, ChevronLeft, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Customer, CustomerFormData } from '../../../types/pawnshop';
import { checkDuplicateCustomer, createCustomer } from '../../../services/customerService';
import { validatePhone, validateEmail, validateAadhar, validatePAN, validatePincode } from '../../../utils/validation';
import { toast } from '../../../utils/toast';
import { modalBackdropVariants, modalContentVariants } from '../../../utils/motion';

interface AddCustomerWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
}

export const AddCustomerWizardModal: React.FC<AddCustomerWizardModalProps> = ({
  isOpen,
  onClose,
  onCustomerCreated
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    // Step 1: Basic Info
    first_name: string;
    last_name: string;
    full_name: string;
    father_name: string;
    phone: string;
    alternate_phone: string;
    email: string;
    date_of_birth: string;
    anniversary_date: string;
    gender: 'male' | 'female' | 'other';
    preferred_language: string;
    customer_type: 'individual' | 'business';
    category: 'retail' | 'wholesale' | 'vip' | 'hni' | 'loyal';
    
    // Step 2: Address
    address: string;
    street: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    country: string;

    // Step 3: KYC
    id_proof_type: 'aadhar' | 'pan' | 'voter_id' | 'passport' | 'driving_license';
    id_proof_number: string;
    photo_url: string;
    kyc_status: 'verified' | 'pending' | 'rejected' | 'expired';
    nominee_name: string;
    nominee_relation: string;
    nominee_contact: string;

    // Step 4: Preferences & Consent
    product_interests: string[];
    sms_consent: boolean;
    whatsapp_consent: boolean;
    email_consent: boolean;
    promotions_consent: boolean;
    birthday_consent: boolean;
    assigned_staff: string;
  }>({
    first_name: '',
    last_name: '',
    full_name: '',
    father_name: '',
    phone: '',
    alternate_phone: '',
    email: '',
    date_of_birth: '',
    anniversary_date: '',
    gender: 'female',
    preferred_language: 'Tamil',
    customer_type: 'individual',
    category: 'retail',

    address: '',
    street: '',
    locality: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    country: 'India',

    id_proof_type: 'aadhar',
    id_proof_number: '',
    photo_url: '',
    kyc_status: 'pending',
    nominee_name: '',
    nominee_relation: '',
    nominee_contact: '',

    product_interests: ['Bridal Sets', 'Traditional Gold'],
    sms_consent: true,
    whatsapp_consent: true,
    email_consent: true,
    promotions_consent: false,
    birthday_consent: true,
    assigned_staff: 'Lakshmi Narayanan'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Real-time auto-sync full name
  const handleNameChange = (first: string, last: string) => {
    const combined = `${first} ${last}`.trim();
    setFormData(prev => ({
      ...prev,
      first_name: first,
      last_name: last,
      full_name: combined
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.full_name || formData.full_name.trim().length < 2) {
        newErrors.full_name = 'Customer full name (at least 2 characters) is required';
      }
      if (!formData.phone || !validatePhone(formData.phone)) {
        newErrors.phone = 'Valid 10-digit Indian mobile number is required';
      }
      if (formData.email && !validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      // Check duplicates early
      const dup = checkDuplicateCustomer(formData.phone, formData.email);
      if (dup.isDuplicate) {
        newErrors.phone = `Duplicate found: Matches ${dup.matchedField} of ${dup.existingCustomer?.customer_code} (${dup.existingCustomer?.full_name})`;
        setDuplicateWarning(`Customer already exists with ${dup.matchedField} (${dup.existingCustomer?.customer_code})`);
      } else {
        setDuplicateWarning(null);
      }
    }

    if (currentStep === 2) {
      if (!formData.address && !formData.street) {
        newErrors.address = 'Street address or locality is required';
      }
      if (!formData.city) {
        newErrors.city = 'City name is required';
      }
      if (formData.pincode && !validatePincode(formData.pincode)) {
        newErrors.pincode = 'Valid 6-digit PIN code required';
      }
    }

    if (currentStep === 3) {
      if (formData.id_proof_number) {
        if (formData.id_proof_type === 'aadhar' && !validateAadhar(formData.id_proof_number)) {
          newErrors.id_proof_number = 'Aadhaar must be 12 digits';
        } else if (formData.id_proof_type === 'pan' && !validatePAN(formData.id_proof_number)) {
          newErrors.id_proof_number = 'PAN format must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(5, prev + 1));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast.error('Please resolve validation errors before saving');
      return;
    }

    try {
      setIsSubmitting(true);
      const customerPayload: CustomerFormData & Partial<Customer> = {
        full_name: formData.full_name,
        first_name: formData.first_name,
        last_name: formData.last_name,
        father_name: formData.father_name,
        phone: formData.phone,
        alternate_phone: formData.alternate_phone,
        email: formData.email,
        date_of_birth: formData.date_of_birth,
        anniversary_date: formData.anniversary_date,
        gender: formData.gender,
        preferred_language: formData.preferred_language,
        customer_type: formData.customer_type,
        category: formData.category,
        address: formData.street ? `${formData.street}, ${formData.locality || ''}, ${formData.city}` : formData.address,
        street: formData.street,
        locality: formData.locality,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
        id_proof_type: formData.id_proof_type,
        id_proof_number: formData.id_proof_number,
        photo_url: formData.photo_url,
        kyc_status: formData.kyc_status,
        nominee_name: formData.nominee_name,
        nominee_relation: formData.nominee_relation,
        nominee_contact: formData.nominee_contact,
        assigned_staff: formData.assigned_staff,
        communication_consent: {
          sms: formData.sms_consent,
          whatsapp: formData.whatsapp_consent,
          email: formData.email_consent,
          promotions: formData.promotions_consent,
          birthday_reminders: formData.birthday_consent
        },
        product_interests: formData.product_interests
      };

      const created = await createCustomer(customerPayload);
      toast.success(`Patron ${created.full_name} registered successfully (${created.customer_code})`);
      onCustomerCreated(created);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to register customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsHeader = [
    { num: 1, title: 'Personal Info', icon: User },
    { num: 2, title: 'Address & Contact', icon: MapPin },
    { num: 3, title: 'KYC & Identity', icon: ShieldCheck },
    { num: 4, title: 'Preferences', icon: HeartHandshake },
    { num: 5, title: 'Review & Save', icon: CheckCircle2 }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        >
          <motion.div 
            variants={modalContentVariants}
            className="bg-[var(--bg-card)] border border-amber-500/30 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8"
          >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white tracking-wide">Register New Patron</h3>
              <p className="text-xs text-gray-400">RCB JEWELRY’S & PAWN SHOP • Customer CRM Onboarding</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Bar */}
        <div className="px-6 py-4 bg-[var(--bg-card)] border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            {stepsHeader.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isPast = step > s.num;

              return (
                <div key={s.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isActive 
                        ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]' 
                        : isPast 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                          : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-color)]'
                    }`}>
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] mt-1.5 font-medium hidden sm:block ${
                      isActive ? 'text-[var(--gold-primary)] font-bold' : isPast ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
                    }`}>
                      {s.title}
                    </span>
                  </div>
                  {s.num < 5 && (
                    <div className={`w-10 sm:w-16 h-0.5 mx-2 rounded ${
                      step > s.num ? 'bg-emerald-500/40' : 'bg-[var(--border-color)]'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto text-sm text-gray-200 space-y-4">
          
          {duplicateWarning && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleNameChange(e.target.value, formData.last_name)}
                    placeholder="e.g. Rajeshwari"
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Last / Family Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleNameChange(formData.first_name, e.target.value)}
                    placeholder="e.g. Sundaram"
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Display / Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Full legal patron name"
                  className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-xl text-white placeholder-gray-600 focus:outline-none ${
                    errors.full_name ? 'border-rose-500' : 'border-[var(--border-color)] focus:border-amber-400/60'
                  }`}
                />
                {errors.full_name && <p className="text-rose-400 text-xs mt-1">{errors.full_name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Primary Mobile Number *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                      placeholder="9840123456"
                      className={`w-full pl-10 pr-3 py-2 bg-[var(--bg-elevated)] border rounded-xl text-white placeholder-gray-600 focus:outline-none ${
                        errors.phone ? 'border-rose-500' : 'border-[var(--border-color)] focus:border-amber-400/60'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-rose-400 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.alternate_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, alternate_phone: e.target.value.replace(/\D/g, '') }))}
                    placeholder="Optional secondary number"
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="patron@rcbjewelry.in"
                    className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-xl text-white placeholder-gray-600 focus:outline-none ${
                      errors.email ? 'border-rose-500' : 'border-[var(--border-color)] focus:border-amber-400/60'
                    }`}
                  />
                  {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Father / Spouse Name</label>
                  <input
                    type="text"
                    value={formData.father_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, father_name: e.target.value }))}
                    placeholder="Legal relation name"
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Customer Classification</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  >
                    <option value="retail">Retail Patron</option>
                    <option value="vip">VIP High-Net-Worth (HNI)</option>
                    <option value="loyal">Loyal Repeat Patron</option>
                    <option value="wholesale">Wholesale / Bullion Trader</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Preferred Language</label>
                  <select
                    value={formData.preferred_language}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferred_language: e.target.value }))}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  >
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Telugu">Telugu</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Address & Geography */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Door No. / Building / Street Address *</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value, address: e.target.value }))}
                  placeholder="e.g. No. 42, Poes Garden, Cathedral Road"
                  className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-xl text-white placeholder-gray-600 focus:outline-none ${
                    errors.address ? 'border-rose-500' : 'border-[var(--border-color)] focus:border-amber-400/60'
                  }`}
                />
                {errors.address && <p className="text-rose-400 text-xs mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Locality / Area</label>
                  <input
                    type="text"
                    value={formData.locality}
                    onChange={(e) => setFormData(prev => ({ ...prev, locality: e.target.value }))}
                    placeholder="e.g. Alwarpet"
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Chennai"
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Tamil Nadu"
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
                    placeholder="600001"
                    className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-xl text-white placeholder-gray-600 focus:outline-none ${
                      errors.pincode ? 'border-rose-500' : 'border-[var(--border-color)] focus:border-amber-400/60'
                    }`}
                  />
                  {errors.pincode && <p className="text-rose-400 text-xs mt-1">{errors.pincode}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    disabled
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-gray-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-gray-400">
                <p>📍 Standard statutory tax invoices and pawn pledge certificates will be delivered to this verified registered communication address.</p>
              </div>
            </div>
          )}

          {/* STEP 3: Verification & KYC */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Identity Proof Document</label>
                  <select
                    value={formData.id_proof_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, id_proof_type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  >
                    <option value="aadhar">Aadhaar Card (UIDAI 12-digit)</option>
                    <option value="pan">PAN Card (Income Tax Dept)</option>
                    <option value="voter_id">Voter ID (Election Commission)</option>
                    <option value="passport">Indian Passport</option>
                    <option value="driving_license">Driving License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Document Number</label>
                  <input
                    type="text"
                    value={formData.id_proof_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, id_proof_number: e.target.value.toUpperCase() }))}
                    placeholder={formData.id_proof_type === 'aadhar' ? '1234 5678 9012' : formData.id_proof_type === 'pan' ? 'ABCDE1234F' : 'ID Reference number'}
                    className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-xl text-white placeholder-gray-600 focus:outline-none ${
                      errors.id_proof_number ? 'border-rose-500' : 'border-[var(--border-color)] focus:border-amber-400/60'
                    }`}
                  />
                  {errors.id_proof_number && <p className="text-rose-400 text-xs mt-1">{errors.id_proof_number}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Initial KYC Verification State</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['pending', 'verified', 'rejected'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, kyc_status: st }))}
                      className={`p-2.5 rounded-xl border text-xs font-medium capitalize text-center transition-colors ${
                        formData.kyc_status === st 
                          ? st === 'verified' 
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                            : st === 'pending' 
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                              : 'bg-rose-500/20 border-rose-400 text-rose-300'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-gray-400'
                      }`}
                    >
                      {st === 'verified' ? '✓ Verified (Original Sighted)' : st === 'pending' ? '⏳ Pending Review' : '✕ Rejected'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--border-color)] pt-4">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Nominee Details (For Pawn Collateral)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Nominee Name</label>
                    <input
                      type="text"
                      value={formData.nominee_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, nominee_name: e.target.value }))}
                      placeholder="Next of kin"
                      className="w-full px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={formData.nominee_relation}
                      onChange={(e) => setFormData(prev => ({ ...prev, nominee_relation: e.target.value }))}
                      placeholder="Spouse / Son / Daughter"
                      className="w-full px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Nominee Contact</label>
                    <input
                      type="tel"
                      value={formData.nominee_contact}
                      onChange={(e) => setFormData(prev => ({ ...prev, nominee_contact: e.target.value }))}
                      placeholder="Mobile number"
                      className="w-full px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Customer Preferences & Consent */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">Jewelry & Metal Category Interests</label>
                <div className="flex flex-wrap gap-2">
                  {['Bridal Sets', 'Traditional Gold', 'Diamond Solitaires', 'Temple Nagas', 'Gold Bullion Coins', 'Silver Pooja Articles', 'Men Platinum'].map((interest) => {
                    const isSelected = formData.product_interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            product_interests: isSelected 
                              ? prev.product_interests.filter(i => i !== interest)
                              : [...prev.product_interests, interest]
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                          isSelected 
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-medium' 
                            : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[var(--border-color)] pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Statutory Communication Consents</h4>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.whatsapp_consent}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_consent: e.target.checked }))}
                    className="w-4 h-4 rounded accent-amber-400 bg-[var(--bg-elevated)] border-[var(--border-color)]"
                  />
                  <span className="text-xs text-gray-300">WhatsApp Tax Invoices, BIS Hallmark certificates, and pledge receipts</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sms_consent}
                    onChange={(e) => setFormData(prev => ({ ...prev, sms_consent: e.target.checked }))}
                    className="w-4 h-4 rounded accent-amber-400 bg-[var(--bg-elevated)] border-[var(--border-color)]"
                  />
                  <span className="text-xs text-gray-300">SMS updates for loan due dates, OTP authentications & billing</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.birthday_consent}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthday_consent: e.target.checked }))}
                    className="w-4 h-4 rounded accent-amber-400 bg-[var(--bg-elevated)] border-[var(--border-color)]"
                  />
                  <span className="text-xs text-gray-300">Birthday & wedding anniversary celebratory greetings with special making-charge discount</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.promotions_consent}
                    onChange={(e) => setFormData(prev => ({ ...prev, promotions_consent: e.target.checked }))}
                    className="w-4 h-4 rounded accent-amber-400 bg-[var(--bg-elevated)] border-[var(--border-color)]"
                  />
                  <span className="text-xs text-gray-300">New collection launch previews and festival bullion offers</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Assigned Client Relationship Officer</label>
                <select
                  value={formData.assigned_staff}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigned_staff: e.target.value }))}
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                >
                  <option value="Lakshmi Narayanan">Lakshmi Narayanan (Senior Relationship Lead)</option>
                  <option value="Senthil Kumar">Senthil Kumar (Store Manager & Pawn Officer)</option>
                  <option value="Kavitha Raman">Kavitha Raman (Diamond & Solitaire Specialist)</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Save */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--bg-card)] border border-amber-500/20 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">New Patron Profile Summary</span>
                    <h4 className="text-lg font-bold text-white mt-0.5">{formData.full_name}</h4>
                    <p className="text-xs text-gray-400">{formData.phone} • {formData.email || 'No email'}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                    {formData.category} Tier
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-color)] text-xs">
                  <div>
                    <span className="text-gray-500 block">Address</span>
                    <span className="text-gray-200">{formData.street || formData.address}, {formData.city}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Identification</span>
                    <span className="text-gray-200 uppercase">{formData.id_proof_type}: {formData.id_proof_number || 'To be presented'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">KYC Verification</span>
                    <span className={formData.kyc_status === 'verified' ? 'text-emerald-400' : 'text-amber-400'}>
                      {formData.kyc_status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Assigned Officer</span>
                    <span className="text-gray-200">{formData.assigned_staff}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero duplicate matches found. Ready to generate unique patron code and initialize CRM profile.</span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer / Navigation Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-elevated)]">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-[var(--border-color)] text-gray-300 hover:text-white hover:bg-white/5 text-xs transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex items-center space-x-1.5 px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
);
};
