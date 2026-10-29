import React, { useState } from 'react';
import { X, Shield, ArrowRightLeft, CheckCircle2, Lock } from 'lucide-react';
import { transferVaultCollateral, auditVaultCustody } from '../../../services/pledgeService';
import { toast } from '../../../utils/toast';

interface VaultTransferAuditModalProps {
  pledge: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VaultTransferAuditModal: React.FC<VaultTransferAuditModalProps> = ({
  pledge,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'transfer' | 'audit'>('transfer');
  const [toLocker, setToLocker] = useState('');
  const [transferReason, setTransferReason] = useState('Routine high-security vault reorganization');
  const [auditNotes, setAuditNotes] = useState('Collateral inspected in safe custody. Tamper-evident barcode seal unbroken and verified.');
  const [conditionConfirmed, setConditionConfirmed] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !pledge) return null;

  const currentLocker = pledge.items?.[0]?.vault_locker_no || 'Vault A - Locker 04';

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toLocker.trim()) {
      toast.error('Destination locker location is required');
      return;
    }
    try {
      setLoading(true);
      await transferVaultCollateral({
        pledge_id: pledge.id,
        from_locker: currentLocker,
        to_locker: toLocker.trim(),
        transfer_reason: transferReason.trim()
      });
      toast.success('Collateral successfully relocated to new vault locker');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Locker transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await auditVaultCustody({
        pledge_id: pledge.id,
        audit_notes: auditNotes.trim(),
        condition_confirmed: conditionConfirmed
      });
      toast.success('Custody audit entry permanently logged to ledger');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Audit logging failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121212] rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Vault Custody &amp; Strongroom Log
              </h3>
              <p className="text-xs text-stone-500 dark:text-neutral-400">
                Contract #{pledge.pledge_number || pledge.pledge_no} &bull; {pledge.customer?.full_name || 'Customer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 dark:border-neutral-800 bg-stone-50/30 dark:bg-neutral-900/30">
          <button
            type="button"
            onClick={() => setActiveTab('transfer')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'transfer'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Relocate Locker
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'audit'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Physical Vault Audit
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {activeTab === 'transfer' ? (
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Current Assigned Vault Locker
                </label>
                <input
                  type="text"
                  disabled
                  value={currentLocker}
                  className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-xs font-mono font-semibold text-stone-700 dark:text-neutral-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Destination Locker Location <span className="text-rose-500">*</span>
                </label>
                <select
                  value={toLocker}
                  onChange={e => setToLocker(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Target Locker</option>
                  <option value="Vault A - Locker 02">Vault A - Locker 02 (Ground Level)</option>
                  <option value="Vault A - Locker 08">Vault A - Locker 08 (Ground Level)</option>
                  <option value="Vault B - Locker 14">Vault B - Locker 14 (Basement Strongroom)</option>
                  <option value="Vault B - Locker 22">Vault B - Locker 22 (Basement Strongroom)</option>
                  <option value="Vault C - Locker 05">Vault C - Locker 05 (High Value Safe)</option>
                  <option value="Audit Transit Box 01">Audit Transit Box 01 (Temporary)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Reason for Collateral Transfer
                </label>
                <textarea
                  rows={2}
                  value={transferReason}
                  onChange={e => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !toLocker}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{loading ? 'Relocating...' : 'Log & Execute Vault Relocation'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAudit} className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Physical vault inspections are logged into the tamper-proof vault ledger for RBI regulatory compliance.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Verification Notes &amp; Observations
                </label>
                <textarea
                  rows={3}
                  value={auditNotes}
                  onChange={e => setAuditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conditionConfirmed}
                  onChange={e => setConditionConfirmed(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span>I confirm the tamper-evident pouch and seals are intact and unaltered.</span>
              </label>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Shield className="w-4 h-4" />
                  <span>{loading ? 'Recording...' : 'Record Vault Audit Pass'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
