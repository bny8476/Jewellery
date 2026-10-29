import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Scale,
  Calendar,
  User,
  CreditCard,
  FileText,
  Printer,
  Clock,
  ArrowRight,
  AlertCircle,
  Gem,
  CheckCircle2,
  Bell,
  RefreshCw,
  Archive,
  ChevronRight,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrencyINR, formatDate } from '../../../utils/formatters';
import { generatePledgeReceipt } from '../../../utils/receiptUtils';
import { toast } from '../../../utils/toast';
import { sendDueReminder, releaseCollateral } from '../../../services/pledgeService';

interface PledgeContractDetailModalProps {
  pledge: any;
  isOpen: boolean;
  onClose: () => void;
  onOpenRepay?: (pledge: any) => void;
  onOpenRedeem?: (pledge: any) => void;
  onOpenRenew?: (pledge: any) => void;
  onRefresh?: () => void;
}

export const PledgeContractDetailModal: React.FC<PledgeContractDetailModalProps> = ({
  pledge,
  isOpen,
  onClose,
  onOpenRepay,
  onOpenRedeem,
  onOpenRenew,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'collateral' | 'ledger' | 'vault'>('overview');
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseStaff, setReleaseStaff] = useState('Senior Vault Custodian');

  if (!isOpen || !pledge) return null;

  const customer = pledge.customer || pledge.customers || {};
  const items = pledge.items || pledge.pledge_items || [];
  const payments = pledge.part_payments || [];
  const returns = pledge.pledge_returns || [];
  const renewals = pledge.pledge_renewals || [];
  const accounting = pledge.pawn_accounting_ledger || [];

  const totalPaidPrincipal = payments.reduce((sum: number, p: any) => sum + (Number(p.principal_paid) || 0), 0);
  const totalPaidInterest = payments.reduce((sum: number, p: any) => sum + (Number(p.interest_paid) || 0), 0);
  const remainingPrincipal = Math.max(0, Number(pledge.loan_amount) - totalPaidPrincipal);

  const isClosed = pledge.status === 'closed';
  const isOverdue = pledge.days_overdue && pledge.days_overdue > 0;

  const handlePrint = () => {
    try {
      generatePledgeReceipt({
        ...pledge,
        customer,
        items
      });
      toast.success('Pledge Agreement PDF generated');
    } catch (e: any) {
      toast.error('Failed to generate PDF: ' + e.message);
    }
  };

  const handleSendReminder = async (type: 'due_soon' | 'overdue') => {
    setIsSendingReminder(true);
    try {
      await sendDueReminder(pledge.id, type);
      toast.success(`Customer notification dispatched for Pledge #${pledge.pledge_number || pledge.pledge_no}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch reminder');
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleReleaseCollateral = async () => {
    if (!window.confirm('Confirm release of collateral jewellery to customer? This action is permanent and logged in the custody audit trail.')) return;
    setIsReleasing(true);
    try {
      await releaseCollateral({
        pledge_id: pledge.id,
        recipient_name: customer.full_name || 'Verified Customer',
        id_verified: true,
        notes: `Handover authorized by ${releaseStaff}`
      });
      toast.success('Collateral jewellery successfully released from vault custody.');
      onRefresh?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to release collateral');
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-neutral-800 bg-stone-50/50 dark:bg-black/60 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-mono">
                  #{pledge.pledge_number || pledge.pledge_no || pledge.id.slice(0, 8)}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    isClosed
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      : isOverdue
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {isClosed ? 'Redeemed & Closed' : isOverdue ? 'Overdue' : pledge.status}
                </span>
                {pledge.collateral_released && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-semibold border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Released
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-neutral-400 mt-0.5">
                Originated on {formatDate(pledge.pledge_date || pledge.created_at)} • Vault Location:{' '}
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  {pledge.vault_locker_no || 'Vault A - Locker 01'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-stone-200 dark:border-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-900 text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Loan Ticket Agreement"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Agreement</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-stone-100 dark:border-neutral-800 flex gap-4 text-xs font-semibold bg-white dark:bg-[#0A0A0A]">
          {[
            { id: 'overview', label: 'Loan Overview & Terms' },
            { id: 'collateral', label: `Pledged Collateral (${items.length || pledge.total_items || 1})` },
            { id: 'ledger', label: `Payments & History (${payments.length + returns.length})` },
            { id: 'vault', label: 'Vault Custody & Release' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 relative cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-stone-500 hover:text-stone-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="modalTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-100 dark:border-neutral-800">
                  <p className="text-[10px] uppercase font-bold text-stone-400 dark:text-neutral-500">Loan Principal</p>
                  <p className="text-base sm:text-lg font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5">
                    {formatCurrencyINR(pledge.loan_amount)}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-1">Disbursed via {pledge.disbursement_method || 'Cash'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-100 dark:border-neutral-800">
                  <p className="text-[10px] uppercase font-bold text-stone-400 dark:text-neutral-500">Principal Balance</p>
                  <p className="text-base sm:text-lg font-bold font-mono text-amber-500 mt-0.5">
                    {formatCurrencyINR(remainingPrincipal)}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-1">Paid: {formatCurrencyINR(totalPaidPrincipal)}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-100 dark:border-neutral-800">
                  <p className="text-[10px] uppercase font-bold text-stone-400 dark:text-neutral-500">Interest Scheme</p>
                  <p className="text-base sm:text-lg font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5">
                    {pledge.interest_rate}% <span className="text-xs font-normal text-stone-400">/{pledge.interest_type || 'mo'}</span>
                  </p>
                  <p className="text-[10px] text-stone-400 mt-1">Collected: {formatCurrencyINR(totalPaidInterest)}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-100 dark:border-neutral-800">
                  <p className="text-[10px] uppercase font-bold text-stone-400 dark:text-neutral-500">Maturity Due Date</p>
                  <p className="text-base sm:text-lg font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5">
                    {formatDate(pledge.due_date || pledge.pledge_date)}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-1">Renewals: {pledge.renewal_count || 0}</p>
                </div>
              </div>

              {/* Customer Patron Profile Card */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-neutral-800 bg-white dark:bg-[#111111] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {customer.full_name || pledge.customer_name || 'Walk-in Patron'}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-neutral-400">
                        Phone: {customer.phone || 'N/A'} • Code: {customer.customer_code || 'CUST-001'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      customer.kyc_status === 'verified'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {customer.kyc_status === 'verified' ? 'KYC Verified Patron' : 'KYC Pending'}
                  </span>
                </div>
                {customer.address && (
                  <p className="text-xs text-stone-500 dark:text-neutral-400 pt-1 border-t border-stone-100 dark:border-neutral-800/80">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">Address:</span> {customer.address}
                  </p>
                )}
              </div>

              {/* Quick Actions Bar */}
              {!isClosed && (
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRepay?.(pledge);
                    }}
                    type="button"
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Receive Repayment / Collect Interest
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRedeem?.(pledge);
                    }}
                    type="button"
                    className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black dark:bg-[#1E1E1E] dark:hover:bg-neutral-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" /> Redeem & Settle Loan
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRenew?.(pledge);
                    }}
                    type="button"
                    className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-900 text-stone-700 dark:text-stone-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Renew / Extend Contract
                  </button>
                  <button
                    onClick={() => handleSendReminder(isOverdue ? 'overdue' : 'due_soon')}
                    disabled={isSendingReminder}
                    type="button"
                    className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-900 text-stone-600 dark:text-neutral-400 text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Bell className="w-3.5 h-3.5" /> {isSendingReminder ? 'Sending...' : 'Send Due Reminder'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COLLATERAL ITEMS */}
          {activeTab === 'collateral' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-neutral-400 pb-2 border-b border-stone-100 dark:border-neutral-800">
                <span>Total Pledged Articles: {items.length || 1}</span>
                <span>
                  Total Gross Wt: <strong className="text-stone-800 dark:text-stone-200">{pledge.total_weight_grams} g</strong> •
                  Appraised Collateral Value:{' '}
                  <strong className="text-stone-800 dark:text-stone-200">
                    {formatCurrencyINR(pledge.appraised_value || pledge.loan_amount / 0.75)}
                  </strong>
                </span>
              </div>

              <div className="space-y-3">
                {items.length > 0 ? (
                  items.map((item: any, idx: number) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-xl border border-stone-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                          <Gem className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                              {item.item_description}
                            </h4>
                            <span className="px-2 py-0.5 rounded bg-amber-100/70 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 text-[10px] font-bold">
                              {item.purity || '22K'}
                            </span>
                            {item.huid_code && (
                              <span className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-neutral-800 text-stone-700 dark:text-stone-300 text-[10px] font-mono">
                                HUID: {item.huid_code}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 dark:text-neutral-400 mt-0.5">
                            Tag: <span className="font-mono text-stone-700 dark:text-stone-300">{item.vault_tag || `ITM-${idx + 1}`}</span> •
                            Condition: {item.condition_grade || 'Good'} • Category: {item.item_category || 'Ornament'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-right shrink-0">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-stone-400">Gross Wt</p>
                          <p className="text-xs font-bold font-mono text-stone-800 dark:text-stone-200">
                            {item.gross_weight_grams} g
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-stone-400">Net Wt</p>
                          <p className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {item.net_weight_grams || item.gross_weight_grams} g
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-stone-400">Appraised</p>
                          <p className="text-xs font-bold font-mono text-stone-900 dark:text-stone-100">
                            {formatCurrencyINR(item.item_value || pledge.loan_amount / 0.75)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-[#141414] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {pledge.item_description || '22K Hallmarked Gold Ornaments'}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-neutral-400">Pledged jewellery article</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-stone-400">Total Weight</p>
                      <p className="text-sm font-bold font-mono">{pledge.total_weight_grams || 10} g</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LEDGER & REPAYMENT TIMELINE */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100 dark:border-neutral-800">
                <span>Transaction & Repayment History</span>
                <span>
                  Total Repaid:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrencyINR(totalPaidPrincipal + totalPaidInterest)}
                  </strong>
                </span>
              </div>

              {payments.length > 0 || returns.length > 0 ? (
                <div className="space-y-2.5">
                  {returns.map((ret: any, idx: number) => (
                    <div
                      key={`ret-${idx}`}
                      className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                            FULL REDEMPTION
                          </span>
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-mono">
                            Receipt #{ret.receipt_number || 'RED-001'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-neutral-400 mt-0.5">
                          Date: {formatDate(ret.return_date || ret.created_at)} • Mode: {ret.payment_mode || 'Cash'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCurrencyINR(ret.total_amount)}
                        </p>
                        <p className="text-[10px] text-stone-400">Settled Full Balance</p>
                      </div>
                    </div>
                  ))}

                  {payments.map((pay: any, idx: number) => (
                    <div
                      key={`pay-${idx}`}
                      className="p-3.5 rounded-xl border border-stone-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-[#141414] flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                            PART PAYMENT
                          </span>
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-mono">
                            Receipt #{pay.receipt_number || `REC-${idx + 1}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-neutral-400 mt-0.5">
                          Date: {formatDate(pay.payment_date || pay.created_at)} • Mode: {pay.payment_mode || 'Cash'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono text-stone-900 dark:text-stone-100">
                          {formatCurrencyINR(pay.payment_amount)}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          Principal: {formatCurrencyINR(pay.principal_paid || 0)} • Interest:{' '}
                          {formatCurrencyINR(pay.interest_paid || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-stone-400 text-xs">
                  No part payments or interest collections recorded yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VAULT CUSTODY & RELEASE */}
          {activeTab === 'vault' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-stone-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-[#141414] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-neutral-400">
                  Collateral Safe Custody Status
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-stone-400 text-[10px] uppercase font-semibold">Vault Locker</p>
                    <p className="font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                      {pledge.vault_locker_no || 'Vault A - Locker 01'}
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-400 text-[10px] uppercase font-semibold">Custody State</p>
                    <p className="font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                      {pledge.collateral_released ? 'Released to Patron' : 'Secured in Safe Vault'}
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-400 text-[10px] uppercase font-semibold">Insured Coverage</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">100% Comprehensive</p>
                  </div>
                </div>
              </div>

              {/* Release Authorization Form */}
              {isClosed && !pledge.collateral_released ? (
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" /> Ready for Collateral Handover
                  </div>
                  <p className="text-xs text-stone-600 dark:text-neutral-300">
                    The loan has been fully redeemed. Please verify government photo ID of the patron, retrieve the jewellery from{' '}
                    <strong className="text-stone-800 dark:text-stone-100">{pledge.vault_locker_no || 'Vault A'}</strong>, and authorize release.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="text"
                      value={releaseStaff}
                      onChange={e => setReleaseStaff(e.target.value)}
                      placeholder="Authorizing Custodian Name"
                      className="px-3 py-2 rounded-lg border border-stone-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-medium text-stone-900 dark:text-stone-100 flex-1"
                    />
                    <button
                      onClick={handleReleaseCollateral}
                      disabled={isReleasing}
                      type="button"
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" /> {isReleasing ? 'Authorizing...' : 'Authorize Jewellery Release'}
                    </button>
                  </div>
                </div>
              ) : pledge.collateral_released ? (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Collateral Formally Released
                  </p>
                  <p className="text-xs text-stone-500 dark:text-neutral-400">
                    Released on {formatDate(pledge.collateral_released_at)} by {pledge.collateral_released_by}.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-stone-200 dark:border-neutral-800 text-xs text-stone-500">
                  Collateral cannot be released until the outstanding loan balance is completely settled.
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
