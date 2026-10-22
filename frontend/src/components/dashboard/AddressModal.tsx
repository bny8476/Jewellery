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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[var(--border-color)] relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--gold-primary)]/15 border border-[var(--gold-primary)]/30 flex items-center justify-center text-[var(--gold-primary)]">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">
              {initialData ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Insured doorstep delivery for your fine jewellery acquisitions
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Label selector */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Address Category
            </label>
            <div className="flex gap-2">
              {(['Home', 'Work', 'Bespoke Studio', 'Other'] as const).map(lbl => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, label: lbl }))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    formData.label === lbl
                      ? 'bg-[#702638] text-white border-[#702638] shadow-xs'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Recipient Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="e.g. Rajeshwari Sundaram"
              className={`w-full bg-[var(--bg-elevated)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] ${
                errors.fullName ? 'border-rose-500' : 'border-[var(--border-color)]'
              }`}
            />
            {errors.fullName && <p className="text-[10px] text-rose-500 mt-1">{errors.fullName}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Contact Phone (10-Digit Mobile) *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="e.g. 9840123456"
              maxLength={13}
              className={`w-full bg-[var(--bg-elevated)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] ${
                errors.phone ? 'border-rose-500' : 'border-[var(--border-color)]'
              }`}
            />
            {errors.phone && <p className="text-[10px] text-rose-500 mt-1">{errors.phone}</p>}
          </div>

          {/* Street */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Street Address & Door No. *
            </label>
            <textarea
              rows={2}
              value={formData.street}
              onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
              placeholder="e.g. Flat 4B, Emerald Court, Cathedral Road, Poes Garden"
              className={`w-full bg-[var(--bg-elevated)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] ${
                errors.street ? 'border-rose-500' : 'border-[var(--border-color)]'
              }`}
            />
            {errors.street && <p className="text-[10px] text-rose-500 mt-1">{errors.street}</p>}
          </div>

          {/* City & State Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="e.g. Chennai"
                className={`w-full bg-[var(--bg-elevated)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] ${
                  errors.city ? 'border-rose-500' : 'border-[var(--border-color)]'
                }`}
              />
              {errors.city && <p className="text-[10px] text-rose-500 mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                State *
              </label>
              <select
                value={formData.state}
                onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
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
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              PIN Code (6-Digit Indian Postal Code) *
            </label>
            <input
              type="text"
              value={formData.pincode}
              onChange={e => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
              placeholder="e.g. 600086"
              maxLength={6}
              className={`w-full bg-[var(--bg-elevated)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] ${
                errors.pincode ? 'border-rose-500' : 'border-[var(--border-color)]'
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
                className="w-4 h-4 rounded text-[#702638] focus:ring-[#702638] border-[var(--border-color)]"
              />
              <span className="text-xs text-[var(--text-main)] font-medium">
                Set as my default shipping address for all future acquisitions
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
