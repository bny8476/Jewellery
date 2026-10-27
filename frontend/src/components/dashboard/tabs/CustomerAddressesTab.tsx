import React from 'react';
import { 
  Plus, 
  MapPin, 
  Check, 
  CheckCircle2, 
  Edit3, 
  Trash2 
} from 'lucide-react';

export interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  label: 'Home' | 'Work' | 'Other';
}

export interface CustomerAddressesTabProps {
  addresses: SavedAddress[];
  onAddNew: () => void;
  onEdit: (addr: SavedAddress) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export const CustomerAddressesTab: React.FC<CustomerAddressesTabProps> = ({
  addresses,
  onAddNew,
  onEdit,
  onDelete,
  onSetDefault
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
            Saved Addresses
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage insured residential and private studio delivery destinations
          </p>
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Address</span>
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="py-16 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] space-y-4 p-8">
          <div className="w-16 h-16 rounded-full bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/30 flex items-center justify-center mx-auto text-[var(--gold-primary)]">
            <MapPin className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-serif text-base font-bold text-[var(--text-main)]">
              No Saved Delivery Addresses
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Add your residence, bridal studio, or private showroom destination for secure, 100% insured delivery with tamper-evident sealed packaging.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Address</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`bg-[var(--bg-card)] rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                addr.isDefault 
                  ? 'border-[var(--gold-primary)] shadow-sm' 
                  : 'border-[var(--border-color)] hover:border-[var(--gold-primary)]/40'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[10px] font-semibold uppercase text-[var(--text-secondary)] shrink-0">
                      {addr.label}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-[var(--text-main)] truncate" title={addr.fullName}>
                      {addr.fullName}
                    </h4>
                  </div>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 px-2.5 py-0.5 rounded-full border border-[var(--gold-primary)]/30 shrink-0">
                      <Check className="w-3 h-3" /> Default Address
                    </span>
                  )}
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {addr.street}, {addr.city}, {addr.state} - <strong className="text-[var(--text-main)] font-mono">{addr.pincode}</strong>
                </p>

                <p className="text-xs text-[var(--text-secondary)] font-mono">
                  Contact: {addr.phone}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--border-color)] text-xs">
                {!addr.isDefault ? (
                  <button
                    type="button"
                    onClick={() => onSetDefault(addr.id)}
                    className="text-xs text-[var(--gold-primary)] font-semibold hover:underline cursor-pointer"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Primary Dispatch
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(addr)}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] cursor-pointer"
                    title="Edit Address"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {addresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDelete(addr.id)}
                      className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-rose-500 cursor-pointer"
                      title="Delete Address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerAddressesTab;
