import React from 'react';
import { 
  Plus, 
  MapPin, 
  Check, 
  CheckCircle2, 
  Edit3, 
  Trash2 
} from 'lucide-react';

import type { SavedAddress } from '../AddressModal';
export type { SavedAddress };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-[#222733]">
        <div>
          <h1 className="text-2xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
            Saved Delivery Addresses
          </h1>
          <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] mt-0.5">
            Manage residential, office, and private destination addresses for insured deliveries
          </p>
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#25282D] hover:bg-black dark:bg-[#181B22] dark:hover:bg-[#202530] dark:border dark:border-[#222733] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Address</span>
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#13151A] rounded-xl border border-[#E5E7EB] dark:border-[#222733] space-y-4 p-8">
          <div className="w-14 h-14 rounded-full bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] flex items-center justify-center mx-auto text-[#8792A2] dark:text-[#8D96A5]">
            <MapPin className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-inter text-base font-bold text-[#25282D] dark:text-[#F7F8FA]">
              No Saved Delivery Addresses
            </h3>
            <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] leading-relaxed">
              Add your residence or private destination for secure, 100% insured delivery in tamper-evident sealed packaging.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#25282D] hover:bg-black dark:bg-[#181B22] dark:hover:bg-[#202530] dark:border dark:border-[#222733] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
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
              className={`bg-white dark:bg-[#13151A] rounded-xl border p-5 transition-all flex flex-col justify-between shadow-xs ${
                addr.isDefault 
                  ? 'border-[#25282D] dark:border-[#C9A45C] ring-1 ring-[#25282D] dark:ring-[#C9A45C]/50' 
                  : 'border-[#E5E7EB] dark:border-[#222733] hover:border-[#8792A2] dark:hover:border-[#C9A45C]/50'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] text-[10px] font-semibold uppercase text-[#8792A2] dark:text-[#8D96A5] shrink-0">
                      {addr.label}
                    </span>
                    <h4 className="font-inter font-bold text-sm text-[#25282D] dark:text-[#F7F8FA] truncate" title={addr.fullName}>
                      {addr.fullName}
                    </h4>
                  </div>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#25282D] dark:text-[#D8B878] bg-[#FAF3E8] dark:bg-[#181B22] px-2.5 py-0.5 rounded-full border border-[#C9A45C]/40 shrink-0">
                      <Check className="w-3 h-3 text-[#C9A45C]" /> Default
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#343A40] dark:text-[#D2D7E2] leading-relaxed">
                  {addr.street}, {addr.city}, {addr.state} - <strong className="text-[#25282D] dark:text-[#F7F8FA] font-mono">{addr.pincode}</strong>
                </p>

                <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] font-mono">
                  Phone: {addr.phone}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E5E7EB] dark:border-[#222733] text-xs">
                {!addr.isDefault ? (
                  <button
                    type="button"
                    onClick={() => onSetDefault(addr.id)}
                    className="text-xs text-[#25282D] dark:text-[#D8B878] font-semibold hover:underline cursor-pointer"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Primary Address
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(addr)}
                    className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#222733] text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:border-[#25282D] dark:hover:border-[#C9A45C] bg-white dark:bg-[#181B22] cursor-pointer transition-colors"
                    title="Edit Address"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {addresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDelete(addr.id)}
                      className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#222733] text-[#8792A2] dark:text-[#8D96A5] hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/40 bg-white dark:bg-[#181B22] cursor-pointer transition-colors"
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
