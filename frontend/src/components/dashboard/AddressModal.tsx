import React, { useState, useEffect } from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { toast } from '../../utils/toast';
import { validatePhone, validatePincode, validateMinLength } from '../../utils/validation';

export interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  label: 'Home' | 'Work' | 'Bespoke Studio' | 'Other';
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: SavedAddress) => void;
  initialData?: SavedAddress | null;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState<Omit<SavedAddress, 'id'>>({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    isDefault: false,
    label: 'Home'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        phone: initialData.phone || '',
        street: initialData.street || '',
        city: initialData.city || '',
        state: initialData.state || 'Tamil Nadu',
        pincode: initialData.pincode || '',
        isDefault: Boolean(initialData.isDefault),
        label: initialData.label || 'Home'
      });
    } else {
      setFormData({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        state: 'Tamil Nadu',
        pincode: '',
        isDefault: false,
        label: 'Home'
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!validateMinLength(formData.fullName, 2)) {
      errs.fullName = 'Recipient name must be at least 2 characters';
    }
    if (!validatePhone(formData.phone)) {
      errs.phone = 'Valid 10-digit Indian mobile number required';
    }
    if (!validateMinLength(formData.street, 5)) {
      errs.street = 'Street address must be at least 5 characters';
    }
    if (!validateMinLength(formData.city, 2)) {
      errs.city = 'City is required';
    }
    if (!validatePincode(formData.pincode)) {
      errs.pincode = 'Valid 6-digit Indian PIN code required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve the errors highlighted in the form.');
      return;
    }

    const savedRecord: SavedAddress = {
      id: initialData?.id || `addr-${Date.now()}`,
      ...formData
    };

    onSave(savedRecord);
    toast.success(initialData ? 'Delivery address updated successfully' : 'New delivery address added');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#13151A] rounded-xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#E5E7EB] dark:border-[#222733] relative max-h-[90vh] overflow-y-auto transition-colors">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-[#E5E7EB] dark:border-[#222733] pb-4">
          <div className="w-10 h-10 rounded-lg bg-[#25282D] dark:bg-[#181B22] flex items-center justify-center text-[#C9A45C]">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
              {initialData ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h3>
            <p className="text-xs text-[#8792A2] dark:text-[#8D96A5]">
              Insured doorstep delivery for your fine jewellery acquisitions
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Label selector */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider mb-1.5">
              Address Category
            </label>
            <div className="flex gap-2">
              {(['Home', 'Work', 'Bespoke Studio', 'Other'] as const).map(lbl => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, label: lbl }))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    formData.label === lbl
                      ? 'bg-[#25282D] dark:bg-[#1C2029] text-white border-[#25282D] dark:border-[#C9A45C]/40 shadow-xs'
                      : 'bg-[#F3F4F6] dark:bg-[#181B22] border-[#E5E7EB] dark:border-[#222733] text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA]'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider mb-1">
              Recipient Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="e.g. Rajeshwari Sundaram"
              className={`w-full bg-[#F3F4F6] dark:bg-[#181B22] border rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] focus:outline-none focus:border-[#25282D] dark:focus:border-[#C9A45C] ${
                errors.fullName ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20' : 'border-[#E5E7EB] dark:border-[#222733]'
              }`}
            />
            {errors.fullName && <p className="text-[10px] text-rose-500 mt-1">{errors.fullName}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider mb-1">
              Contact Phone (10-Digit Mobile) *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="e.g. 9840123456"
              maxLength={13}
              className={`w-full bg-[#F3F4F6] dark:bg-[#181B22] border rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] font-mono focus:outline-none focus:border-[#25282D] dark:focus:border-[#C9A45C] ${
                errors.phone ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20' : 'border-[#E5E7EB] dark:border-[#222733]'
              }`}
            />
            {errors.phone && <p className="text-[10px] text-rose-500 mt-1">{errors.phone}</p>}
          </div>

          {/* Street */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider mb-1">
              Street Address & Door No. *
            </label>
            <textarea
              rows={2}
              value={formData.street}
              onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
              placeholder="e.g. Flat 4B, Emerald Court, Cathedral Road, Poes Garden"
              className={`w-full bg-[#F3F4F6] dark:bg-[#181B22] border rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] focus:outline-none focus:border-[#25282D] dark:focus:border-[#C9A45C] ${
                errors.street ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20' : 'border-[#E5E7EB] dark:border-[#222733]'
              }`}
            />
            {errors.street && <p className="text-[10px] text-rose-500 mt-1">{errors.street}</p>}
          </div>

          {/* City & State Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="e.g. Chennai"
                className={`w-full bg-[#F3F4F6] dark:bg-[#181B22] border rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] focus:outline-none focus:border-[#25282D] dark:focus:border-[#C9A45C] ${
                  errors.city ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20' : 'border-[#E5E7EB] dark:border-[#222733]'
                }`}
              />
              {errors.city && <p className="text-[10px] text-rose-500 mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider mb-1">
                State *
              </label>
              <select
                value={formData.state}
                onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] rounded-lg px-3 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] focus:outline-none focus:border-[#25282D] dark:focus:border-[#C9A45C]"
              >
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Kerala">Kerala</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Telangana">Telangana</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
              </select>
            </div>
          </div>

          {/* PIN code */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider mb-1">
              PIN Code (6-Digit Indian Postal Code) *
            </label>
            <input
              type="text"
              value={formData.pincode}
              onChange={e => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
              placeholder="e.g. 600086"
              maxLength={6}
              className={`w-full bg-[#F3F4F6] dark:bg-[#181B22] border rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] font-mono focus:outline-none focus:border-[#25282D] dark:focus:border-[#C9A45C] ${
                errors.pincode ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20' : 'border-[#E5E7EB] dark:border-[#222733]'
              }`}
            />
            {errors.pincode && <p className="text-[10px] text-rose-500 mt-1">{errors.pincode}</p>}
          </div>

          {/* Default address checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={e => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="w-4 h-4 rounded text-[#25282D] focus:ring-[#25282D] border-[#E5E7EB] dark:border-[#222733]"
              />
              <span className="text-xs text-[#343A40] dark:text-[#D2D7E2] font-medium">
                Set as my default shipping address for all future acquisitions
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#222733]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-[#222733] text-xs font-semibold text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#25282D] hover:bg-black dark:bg-[#1C2029] dark:hover:bg-[#252A36] text-white text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer dark:border dark:border-[#C9A45C]/40"
            >
              <Check className="w-4 h-4 text-[#C9A45C]" /> Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressModal;
