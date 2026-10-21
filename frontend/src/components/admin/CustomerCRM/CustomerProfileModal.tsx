import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, 
  Calendar, Clock, CreditCard, Coins, ShoppingBag, 
  FileText, MessageSquare, 
  Plus, Download, Printer, Send,
  Sparkles
} from 'lucide-react';
import type { 
  Customer, CustomerDocument, CustomerNote, CustomerFollowUpTask, 
  CustomerCommunication, 
  CustomerLoyaltyLog, CustomerActivityItem 
} from '../../../types/pawnshop';
import { 
  getCustomerDocuments, uploadCustomerDocument, updateKycStatus,
  getCustomerNotes, addCustomerNote,
  getCustomerTasks, addCustomerTask, updateCustomerTaskStatus,
  getCustomerCommunications,
  getCustomerAppointments,
  getCustomerComplaints,
  getCustomerLoyaltyHistory, adjustLoyaltyPoints,
  getCustomerActivityTimeline
} from '../../../services/customerService';
import { formatCurrencyINR } from '../../../utils/formatters';
import { toast } from '../../../utils/toast';
import { validatePAN, validateAadhaar } from '../../../utils/validation';
import { motion, AnimatePresence } from 'framer-motion';
import { modalBackdropVariants, modalContentVariants } from '../../../utils/motion';

interface CustomerProfileModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onOpenPaymentModal: (cust: Customer) => void;
  onOpenMessageModal: (cust: Customer) => void;
  onRefreshCustomer: () => void;
  onStartSale?: (cust: Customer) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  customer,
  onClose,
  onOpenPaymentModal,
  onOpenMessageModal,
  onRefreshCustomer,
  onStartSale
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Sub-module states
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [tasks, setTasks] = useState<CustomerFollowUpTask[]>([]);
  const [communications, setCommunications] = useState<CustomerCommunication[]>([]);
  const [loyaltyLogs, setLoyaltyLogs] = useState<CustomerLoyaltyLog[]>([]);
  const [timeline, setTimeline] = useState<CustomerActivityItem[]>([]);

  // Note creation form
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'general' | 'sales' | 'pawn' | 'complaint' | 'vip'>('general');

  // Task creation form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskStaff, setNewTaskStaff] = useState('Lakshmi Narayanan');

  // Loyalty adjustment form
  const [pointsDelta, setPointsDelta] = useState<number>(100);
  const [pointsReason, setPointsReason] = useState('Promotional Festival Bonus');

  // Document upload form
  const [docType, setDocType] = useState<any>('aadhar');
  const [docNumber, setDocNumber] = useState('');

  useEffect(() => {
    if (customer && isOpen) {
      loadCustomerDetails(customer.id);
    }
  }, [customer, isOpen]);

  const loadCustomerDetails = async (id: string) => {
    try {
      const [docs, nts, tsks, comms, , , loy, tml] = await Promise.all([
        getCustomerDocuments(id),
        getCustomerNotes(id),
        getCustomerTasks(id),
        getCustomerCommunications(id),
        getCustomerAppointments(id),
        getCustomerComplaints(id),
        getCustomerLoyaltyHistory(id),
        getCustomerActivityTimeline(id)
      ]);

      setDocuments(docs);
      setNotes(nts);
      setTasks(tsks);
      setCommunications(comms);
      setLoyaltyLogs(loy);
      setTimeline(tml);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!customer) return null;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error('Note title and details required');
      return;
    }
    await addCustomerNote({
      customer_id: customer.id,
      title: newNoteTitle,
      content: newNoteContent,
      category: newNoteCategory,
      priority: 'medium',
      created_by: 'admin@luxury.com'
    });
    setNewNoteTitle('');
    setNewNoteContent('');
    toast.success('Note added to CRM record');
    loadCustomerDetails(customer.id);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error('Task title required');
      return;
    }
    await addCustomerTask({
      customer_id: customer.id,
      title: newTaskTitle,
      assigned_staff: newTaskStaff,
      due_date: newTaskDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'high'
    });
    setNewTaskTitle('');
    toast.success('Follow-up task assigned');
    loadCustomerDetails(customer.id);
  };

  const handleKycStatusChange = async (status: 'verified' | 'rejected' | 'pending') => {
    await updateKycStatus(customer.id, status, 'admin@luxury.com', status === 'rejected' ? 'Blurry scan or mismatched details' : undefined);
    toast.success(`KYC status updated to ${status.toUpperCase()}`);
    onRefreshCustomer();
    loadCustomerDetails(customer.id);
  };

  const handleAdjustPoints = async () => {
    if (!pointsDelta) return;
    await adjustLoyaltyPoints(customer.id, pointsDelta, pointsReason, 'admin@luxury.com');
    toast.success(`Loyalty points updated (${pointsDelta > 0 ? '+' : ''}${pointsDelta})`);
    onRefreshCustomer();
    loadCustomerDetails(customer.id);
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    const docClean = docNumber.trim();
    if (!docClean) {
      toast.error('Document reference number required');
      return;
    }
    if (docType === 'pan') {
      if (!validatePAN(docClean)) {
        toast.error('Invalid PAN format: Must be 10 characters (e.g. ABCDE1234F)');
        return;
      }
    } else if (docType === 'aadhar') {
      if (!validateAadhaar(docClean.replace(/\s/g, ''))) {
        toast.error('Invalid Aadhaar format: Must be 12 digits');
        return;
      }
    }

    await uploadCustomerDocument({
      customer_id: customer.id,
      document_type: docType,
      document_number: docClean.toUpperCase(),
      document_name: `${docType.toUpperCase()}_Verified_Copy.pdf`,
      status: 'verified'
    });
    setDocNumber('');
    toast.success('KYC Document uploaded and linked');
    loadCustomerDetails(customer.id);
  };

  const tabs = [
    { id: 'overview', label: '1. Overview' },
    { id: 'personal', label: '2. Personal Info' },
    { id: 'address', label: '3. Address & Contacts' },
    { id: 'kyc', label: '4. KYC & Documents' },
    { id: 'purchases', label: '5. Purchase History' },
    { id: 'pawn_loans', label: '6. Pawn Loans' },
    { id: 'payments', label: '7. Payments & Balances' },
    { id: 'invoices', label: '8. Invoices & Receipts' },
    { id: 'loyalty', label: '9. Loyalty & Rewards' },
    { id: 'comms', label: '10. Communications' },
    { id: 'notes_tasks', label: '11. Notes & Follow-ups' },
    { id: 'timeline', label: '12. Activity Timeline' },
    { id: 'consent', label: '13. Consent & Privacy' },
    { id: 'audit', label: '14. Audit History' }
  ];

  return (
    <AnimatePresence>
      {isOpen && customer && (
        <motion.div 
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        >
          <motion.div 
            variants={modalContentVariants}
            className="bg-[var(--bg-card)] border border-amber-500/30 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]"
          >
        
        {/* Luxury Header Banner */}
        <div className="bg-gradient-to-r from-[var(--bg-elevated)] via-[var(--bg-card)] to-[var(--bg-elevated)] border-b border-[var(--border-color)] p-5 sm:p-6 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-start sm:items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(212,175,55,0.3)] shrink-0 border border-amber-300">
                {customer.full_name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-wide">{customer.full_name}</h2>
                  <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                    {customer.customer_code}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase font-medium">
                    {customer.category || 'Retail'}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border uppercase font-medium ${
                    customer.kyc_status === 'verified'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : customer.kyc_status === 'pending'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}>
                    KYC: {customer.kyc_status?.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>📞 {customer.phone}</span>
                  {customer.email && <span>✉️ {customer.email}</span>}
                  <span>📍 {customer.city || 'Chennai'}, {customer.state || 'Tamil Nadu'}</span>
                  <span>Officer: <strong className="text-gray-300">{customer.assigned_staff || 'General'}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-center">
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/5">
            <span className="text-[11px] font-semibold text-amber-400/90 uppercase tracking-wider mr-1">
              Quick Actions:
            </span>

            {onStartSale && (
              <button
                onClick={() => {
                  onStartSale(customer);
                  onClose();
                }}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-all shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Create Sale</span>
              </button>
            )}

            <button
              onClick={() => onOpenPaymentModal(customer)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-amber-300 border border-amber-500/30 text-xs transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>Record Payment</span>
            </button>

            <button
              onClick={() => onOpenMessageModal(customer)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-gray-200 border border-white/10 text-xs transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Send Message</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('notes_tasks');
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-gray-200 border border-white/10 text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Add Note</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('kyc');
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-gray-200 border border-white/10 text-xs transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Verify KYC</span>
            </button>

            <button
              onClick={() => {
                toast.success(`Statement for ${customer.full_name} generated and ready for print`);
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-gray-200 border border-white/10 text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-gray-400" />
              <span>Statement PDF</span>
            </button>
          </div>
        </div>

        {/* 14 Tabs Navigation Bar */}
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-elevated)] overflow-x-auto shrink-0 scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5 font-semibold'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Body Content Area */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-gray-200 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl">
                  <span className="text-[10px] text-gray-400 block">Total Purchases</span>
                  <span className="text-base font-bold font-mono text-white mt-0.5 block">
                    {formatCurrencyINR(customer.total_purchase_value || 0)}
                  </span>
                  <span className="text-[10px] text-gray-500">{customer.total_purchases || 0} completed invoices</span>
                </div>

                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl">
                  <span className="text-[10px] text-gray-400 block">Outstanding Invoice Debt</span>
                  <span className="text-base font-bold font-mono text-amber-400 mt-0.5 block">
                    {formatCurrencyINR(customer.outstanding_receivables || 0)}
                  </span>
                  <span className="text-[10px] text-gray-500">Retail balance</span>
                </div>

                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl">
                  <span className="text-[10px] text-gray-400 block">Active Pawn Loans</span>
                  <span className="text-base font-bold font-mono text-white mt-0.5 block">
                    {customer.active_pawn_loans || 0}
                  </span>
                  <span className="text-[10px] text-gray-500">Pledged gold articles</span>
                </div>

                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl">
                  <span className="text-[10px] text-gray-400 block">Pawn Principal Due</span>
                  <span className="text-base font-bold font-mono text-amber-500 mt-0.5 block">
                    {formatCurrencyINR(customer.outstanding_pawn_principal || 0)}
                  </span>
                  <span className="text-[10px] text-gray-500">Collateral loan balance</span>
                </div>

                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl">
                  <span className="text-[10px] text-gray-400 block">Loyalty Points</span>
                  <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                    {customer.loyalty_points || 0} pts
                  </span>
                  <span className="text-[10px] text-gray-500">{customer.loyalty_tier || 'Standard'} Tier</span>
                </div>

                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl">
                  <span className="text-[10px] text-gray-400 block">Account Status</span>
                  <span className="text-base font-bold font-mono text-white mt-0.5 block">
                    {customer.is_active ? 'Active' : 'Archived'}
                  </span>
                  <span className="text-[10px] text-gray-500">Registered {new Date(customer.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Outstanding Alerts & Action Banners */}
              {(customer.outstanding_receivables || 0) > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white">Pending Retail Invoice Receivable</h4>
                      <p className="text-gray-300">Customer has an outstanding balance of {formatCurrencyINR(customer.outstanding_receivables || 0)}.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenPaymentModal(customer)}
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-semibold rounded-lg text-xs"
                  >
                    Collect Payment
                  </button>
                </div>
              )}

              {/* Recent Activity Mini-Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-3">
                  <h4 className="font-semibold text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Recent Activity Stream</span>
                  </h4>
                  {timeline.length > 0 ? (
                    <div className="space-y-2.5">
                      {timeline.slice(0, 4).map((item) => (
                        <div key={item.id} className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-white/5 flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between items-baseline">
                              <span className="font-semibold text-gray-200">{item.title}</span>
                              <span className="text-[10px] text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 py-4 text-center">No recent timeline events</p>
                  )}
                </div>

                <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-3">
                  <h4 className="font-semibold text-white flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Pending Follow-up Tasks</span>
                  </h4>
                  {tasks.length > 0 ? (
                    <div className="space-y-2">
                      {tasks.slice(0, 3).map((tsk) => (
                        <div key={tsk.id} className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-white/5 flex items-start justify-between">
                          <div>
                            <span className="font-medium text-white block">{tsk.title}</span>
                            <span className="text-[10px] text-gray-400">Assigned: {tsk.assigned_staff} • Due: {tsk.due_date}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 capitalize">
                            {tsk.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 py-4 text-center">No tasks currently pending</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-4">
                <h4 className="font-semibold text-white text-sm">Personal & Demographic Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-500 block">Full Legal Name</span>
                    <span className="text-white font-medium">{customer.full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Father / Spouse Name</span>
                    <span className="text-white font-medium">{customer.father_name || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Date of Birth</span>
                    <span className="text-white font-medium">{customer.date_of_birth || 'Not recorded'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Gender</span>
                    <span className="text-white font-medium capitalize">{customer.gender || 'Female'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Preferred Language</span>
                    <span className="text-white font-medium">{customer.preferred_language || 'Tamil'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Patron Classification</span>
                    <span className="text-amber-400 font-medium capitalize">{customer.category || 'Retail'}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-4">
                <h4 className="font-semibold text-white text-sm">Nominee Designation (Pawn Collateral Release)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-500 block">Nominee Name</span>
                    <span className="text-white font-medium">{customer.nominee_name || 'Direct family member'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Relationship</span>
                    <span className="text-white font-medium">{customer.nominee_relation || 'Spouse'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Nominee Phone</span>
                    <span className="text-white font-medium">{customer.nominee_contact || customer.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADDRESS & CONTACTS */}
          {activeTab === 'address' && (
            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-4">
              <h4 className="font-semibold text-white text-sm">Registered Communication Address</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 block">Street / Building Address</span>
                  <span className="text-white font-medium">{customer.street || customer.address}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Locality / Area</span>
                  <span className="text-white font-medium">{customer.locality || 'Alwarpet'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">City</span>
                  <span className="text-white font-medium">{customer.city || 'Chennai'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">State & Country</span>
                  <span className="text-white font-medium">{customer.state || 'Tamil Nadu'}, {customer.country || 'India'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Postal PIN Code</span>
                  <span className="text-white font-mono font-medium">{customer.pincode || '600001'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Verified Telephony</span>
                  <span className="text-white font-medium">Primary: {customer.phone} {customer.alternate_phone ? `| Alt: ${customer.alternate_phone}` : ''}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KYC & DOCUMENTS */}
          {activeTab === 'kyc' && (
            <div className="space-y-6">
              {/* KYC Status Card */}
              <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-gray-400 block">Current KYC Compliance State</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-base font-bold uppercase ${
                      customer.kyc_status === 'verified' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {customer.kyc_status}
                    </span>
                    {customer.kyc_verified_at && (
                      <span className="text-gray-500 text-xs">
                        (Verified on {new Date(customer.kyc_verified_at).toLocaleDateString()} by {customer.kyc_verified_by})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleKycStatusChange('verified')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    ✓ Mark Verified
                  </button>
                  <button
                    onClick={() => handleKycStatusChange('pending')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold transition-colors shadow-xs"
                  >
                    ⏳ Mark Pending
                  </button>
                  <button
                    onClick={() => handleKycStatusChange('rejected')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    ✕ Reject Document
                  </button>
                </div>
              </div>

              {/* Document Registry Table */}
              <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-3">
                <h4 className="font-semibold text-white">Registered Identification Documents</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-[var(--border-color)] text-gray-500 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="py-2">Document Type</th>
                        <th className="py-2">Masked ID Number</th>
                        <th className="py-2">File Reference</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Uploaded At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {documents.map((d) => (
                        <tr key={d.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 font-semibold text-white uppercase">{d.document_type}</td>
                          <td className="py-2.5 font-mono text-gray-300">{d.document_number || 'Sighted'}</td>
                          <td className="py-2.5 text-gray-400">{d.document_name}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                              {d.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-gray-500">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Quick Add Document Form */}
                <form onSubmit={handleAddDoc} className="pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center gap-2">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-white text-xs"
                  >
                    <option value="aadhar">Aadhaar Card</option>
                    <option value="pan">PAN Card</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="passport">Passport</option>
                  </select>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="Document reference number"
                    className="px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-white text-xs flex-1 min-w-[200px]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-semibold rounded-lg text-xs"
                  >
                    Link New Doc
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: PURCHASE HISTORY */}
          {activeTab === 'purchases' && (
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-white">Retail Jewellery Purchases & Invoices</h4>
                <span className="text-gray-400 text-xs">
                  Lifetime Value: <strong className="text-amber-400">{formatCurrencyINR(customer.total_purchase_value || 0)}</strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-[var(--border-color)] text-gray-500 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2">Invoice #</th>
                      <th className="py-2">Date</th>
                      <th className="py-2">Items</th>
                      <th className="py-2">Purity</th>
                      <th className="py-2">Gross Amount</th>
                      <th className="py-2">Payment Method</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3 font-mono text-amber-400 font-semibold">INV-2024-8921</td>
                      <td className="py-3 text-gray-300">10-Feb-2024</td>
                      <td className="py-3 text-white font-medium">Royal Vivaah Ruby & Kundan Bridal Set (48.5g)</td>
                      <td className="py-3 text-gray-300">22K BIS 916</td>
                      <td className="py-3 font-mono font-bold text-white">₹1,85,000</td>
                      <td className="py-3 text-gray-400 uppercase">Bank NEFT</td>
                      <td className="py-3">
                        <button 
                          onClick={() => toast.success('Printing Tax Invoice INV-2024-8921')}
                          className="text-amber-400 hover:underline flex items-center space-x-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3 font-mono text-amber-400 font-semibold">INV-2023-4102</td>
                      <td className="py-3 text-gray-300">15-Nov-2023</td>
                      <td className="py-3 text-white font-medium">Diamond Halo Solitaire Earrings (8.6g)</td>
                      <td className="py-3 text-gray-300">18K Solitaire</td>
                      <td className="py-3 font-mono font-bold text-white">₹85,000</td>
                      <td className="py-3 text-gray-400 uppercase">UPI / Card</td>
                      <td className="py-3">
                        <button 
                          onClick={() => toast.success('Printing Tax Invoice INV-2023-4102')}
                          className="text-amber-400 hover:underline flex items-center space-x-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: PAWN LOANS */}
          {activeTab === 'pawn_loans' && (
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-white">Collateral Pawn Loans & Pledges</h4>
                <span className="text-gray-400 text-xs">
                  Active Principal: <strong className="text-amber-500">{formatCurrencyINR(customer.outstanding_pawn_principal || 0)}</strong>
                </span>
              </div>

              {(customer.active_pawn_loans || 0) > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-[var(--border-color)] text-gray-500 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="py-2">Pledge Ref #</th>
                        <th className="py-2">Pledged Item</th>
                        <th className="py-2">Net Gold Wt</th>
                        <th className="py-2">Principal</th>
                        <th className="py-2">Monthly Interest</th>
                        <th className="py-2">Due Date</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr className="hover:bg-white/[0.02]">
                        <td className="py-3 font-mono text-amber-400 font-bold">PL-2026-0891</td>
                        <td className="py-3 text-white">22K Traditional Handmade Rope Chain</td>
                        <td className="py-3 font-mono text-gray-300">42.50 g</td>
                        <td className="py-3 font-mono font-bold text-white">₹85,000</td>
                        <td className="py-3 font-mono text-gray-300">2.0% (₹1,700/mo)</td>
                        <td className="py-3 text-gray-300">15-Mar-2024</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                            Active
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => onOpenPaymentModal(customer)}
                            className="text-amber-400 hover:underline text-xs"
                          >
                            Repay / Settle
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Coins className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                  <p>No active collateral pawn loans recorded for this patron.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PAYMENTS & BALANCES */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl">
                  <span className="text-gray-400 text-xs block">Invoice Debt Balance</span>
                  <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                    {formatCurrencyINR(customer.outstanding_receivables || 0)}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1">Direct retail jewelry purchase balance</p>
                </div>
                <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl">
                  <span className="text-gray-400 text-xs block">Pawn Loan Balance</span>
                  <span className="text-xl font-bold font-mono text-amber-500 mt-1 block">
                    {formatCurrencyINR(customer.outstanding_pawn_principal || 0)}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1">Secured against pledged jewelry collateral</p>
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
                <h4 className="font-semibold text-white mb-3">Payment Receipts Ledger</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-[var(--bg-elevated)] border border-white/5 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-white block">Receipt #RCP-892101</span>
                      <span className="text-gray-400 text-[11px]">Paid via Bank NEFT on 10-Feb-2024</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">₹1,85,000</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-elevated)] border border-white/5 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-white block">Receipt #RCP-410294</span>
                      <span className="text-gray-400 text-[11px]">Paid via UPI on 15-Nov-2023</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">₹85,000</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: INVOICES & RECEIPTS */}
          {activeTab === 'invoices' && (
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-3">
              <h4 className="font-semibold text-white">Statutory Tax Invoices & BIS Hallmark Proofs</h4>
              <p className="text-gray-400 leading-relaxed text-xs">
                Invoices comply with Central Goods & Services Tax (CGST) 1.5% and State GST (SGST) 1.5% for precious metals, bearing BIS Hallmark HUID authenticity seals.
              </p>
              <div className="space-y-2 pt-2">
                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="font-semibold text-white block">Tax Invoice INV-2024-8921 (BIS Hallmarked)</span>
                      <span className="text-gray-400 text-[11px]">Date: 10-Feb-2024 • Amount: ₹1,85,000 • GST Paid: ₹5,550</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success('Downloading Tax Invoice INV-2024-8921 PDF')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg text-xs transition-colors shadow-xs"
                  >
                    Download Invoice PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: LOYALTY & REWARDS */}
          {activeTab === 'loyalty' && (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-gray-400 block">Available Reward Points Balance</span>
                  <div className="flex items-baseline space-x-3 mt-1">
                    <span className="text-2xl font-bold font-mono text-amber-400">{customer.loyalty_points || 0}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase">
                      {customer.loyalty_tier || 'Standard'} Tier Patron
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    value={pointsDelta}
                    onChange={(e) => setPointsDelta(parseInt(e.target.value) || 0)}
                    aria-label="Loyalty points change"
                    className="w-24 px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-white font-mono text-xs"
                  />
                  <input
                    type="text"
                    value={pointsReason}
                    onChange={(e) => setPointsReason(e.target.value)}
                    placeholder="Reason for adjustment"
                    aria-label="Reason for points adjustment"
                    className="w-44 px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-white text-xs"
                  />
                  <button
                    onClick={handleAdjustPoints}
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-semibold rounded-lg text-xs"
                  >
                    Adjust Points
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-3">
                <h4 className="font-semibold text-white">Points Accrual & Redemption History</h4>
                <div className="space-y-2">
                  {loyaltyLogs.map((l) => (
                    <div key={l.id} className="p-2.5 bg-[var(--bg-elevated)] border border-white/5 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-medium text-white block">{l.reason}</span>
                        <span className="text-[10px] text-gray-500">{new Date(l.created_at).toLocaleDateString()} by {l.recorded_by}</span>
                      </div>
                      <span className={`font-mono font-bold ${l.points_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {l.points_change >= 0 ? `+${l.points_change}` : l.points_change} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: COMMUNICATIONS */}
          {activeTab === 'comms' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-white">Customer Communication Log</h4>
                <button
                  onClick={() => onOpenMessageModal(customer)}
                  className="px-3 py-1.5 bg-amber-400 text-black font-semibold rounded-lg text-xs flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {communications.map((c) => (
                  <div key={c.id} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-white flex items-center space-x-2">
                        <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-amber-400">
                          {c.channel}
                        </span>
                        <span>{c.subject}</span>
                      </span>
                      <span className="text-[10px] text-gray-500">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">{c.message}</p>
                    <span className="text-[10px] text-emerald-400 block pt-1">Status: {c.status} • Logged by {c.logged_by}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: NOTES & FOLLOW-UPS */}
          {activeTab === 'notes_tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notes Column */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Internal Staff Notes</h4>
                
                <form onSubmit={handleAddNote} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl space-y-2">
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Note headline / topic"
                    className="w-full px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-white text-xs"
                  />
                  <textarea
                    rows={2}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Enter confidential internal note..."
                    className="w-full px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-white text-xs resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <select
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value as any)}
                      className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded text-[11px] text-gray-300"
                    >
                      <option value="general">General</option>
                      <option value="sales">Sales</option>
                      <option value="pawn">Pawn</option>
                      <option value="vip">VIP Service</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-semibold rounded text-xs"
                    >
                      Save Note
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  {notes.map((n) => (
                    <div key={n.id} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-white">{n.title}</span>
                        <span className="text-[10px] text-gray-500">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-300 text-xs">{n.content}</p>
                      <span className="text-[10px] text-gray-500 block">By: {n.created_by}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up Tasks Column */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Scheduled Follow-up Tasks</h4>

                <form onSubmit={handleAddTask} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl space-y-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task description (e.g. Call regarding choker preview)"
                    className="w-full px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-white text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded text-[11px] text-white flex-1"
                    />
                    <select
                      value={newTaskStaff}
                      onChange={(e) => setNewTaskStaff(e.target.value)}
                      className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded text-[11px] text-white"
                    >
                      <option value="Lakshmi Narayanan">Lakshmi Narayanan</option>
                      <option value="Senthil Kumar">Senthil Kumar</option>
                      <option value="Kavitha Raman">Kavitha Raman</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded text-xs"
                  >
                    Schedule Task
                  </button>
                </form>

                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t.id} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex items-start justify-between">
                      <div>
                        <span className="font-semibold text-white block">{t.title}</span>
                        <span className="text-[10px] text-gray-400">Assigned: {t.assigned_staff} • Due: {t.due_date}</span>
                      </div>
                      <select
                        value={t.status}
                        onChange={(e) => {
                          updateCustomerTaskStatus(t.id, e.target.value as any);
                          toast.success('Task status updated');
                          loadCustomerDetails(customer.id);
                        }}
                        className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded text-[10px] text-amber-400 font-semibold uppercase"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: ACTIVITY TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-4">
              <h4 className="font-semibold text-white">Chronological Lifetime Activity Log</h4>
              <div className="relative pl-6 border-l-2 border-amber-500/20 space-y-4">
                {timeline.map((act) => (
                  <div key={act.id} className="relative group">
                    <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-black" />
                    <div className="p-3 bg-[var(--bg-elevated)] border border-white/5 rounded-xl space-y-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-white">{act.title}</span>
                        <span className="text-[10px] text-gray-500">{new Date(act.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-300 text-xs">{act.description}</p>
                      <span className="text-[10px] text-gray-500 block">Actor: {act.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 13: CONSENT & PRIVACY */}
          {activeTab === 'consent' && (
            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-4">
              <h4 className="font-semibold text-white text-sm">Data Privacy & Communication Preferences</h4>
              <p className="text-gray-400 text-xs leading-relaxed">
                Registered in compliance with the Digital Personal Data Protection (DPDP) Act. All customer financial details, pledged article weights, and identity documents are stored in secure private vaults.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[var(--bg-elevated)] border border-white/5 rounded-xl flex items-center justify-between">
                  <span>WhatsApp Invoices & Hallmark Proofs</span>
                  <span className="text-emerald-400 font-bold">✓ Approved</span>
                </div>
                <div className="p-3 bg-[var(--bg-elevated)] border border-white/5 rounded-xl flex items-center justify-between">
                  <span>SMS Loan Reminders & Security Alerts</span>
                  <span className="text-emerald-400 font-bold">✓ Approved</span>
                </div>
                <div className="p-3 bg-[var(--bg-elevated)] border border-white/5 rounded-xl flex items-center justify-between">
                  <span>Birthday & Anniversary Greetings</span>
                  <span className="text-emerald-400 font-bold">✓ Approved</span>
                </div>
                <div className="p-3 bg-[var(--bg-elevated)] border border-white/5 rounded-xl flex items-center justify-between">
                  <span>Promotional Bullion & Festival Offers</span>
                  <span className="text-gray-400">Opt-out / Restricted</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: AUDIT HISTORY */}
          {activeTab === 'audit' && (
            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-3">
              <h4 className="font-semibold text-white text-sm">Security Audit Trail (Immutable Log)</h4>
              <p className="text-gray-400 text-xs">
                Administrative security log of profile creation, edits, KYC verifications, and financial ledger touches for patron {customer.customer_code}.
              </p>
              <div className="space-y-2 pt-2">
                <div className="p-3 bg-[var(--bg-elevated)] border border-white/5 rounded-xl text-xs font-mono text-gray-300">
                  <span className="text-amber-400">[2024-03-01 11:00 IST]</span> CUSTOMER_UPDATED: Assigned staff confirmed as Lakshmi Narayanan. Actor: admin@luxury.com
                </div>
                <div className="p-3 bg-[var(--bg-elevated)] border border-white/5 rounded-xl text-xs font-mono text-gray-300">
                  <span className="text-amber-400">[2024-02-10 14:20 IST]</span> POS_SALE_COMPLETED: Invoice #INV-2024-8921 for ₹1,85,000. Actor: pos_system
                </div>
                <div className="p-3 bg-[var(--bg-elevated)] border border-white/5 rounded-xl text-xs font-mono text-gray-300">
                  <span className="text-amber-400">[2024-01-15 10:30 IST]</span> KYC_VERIFIED: Aadhaar 982144129012 verified with original document copy. Actor: admin@luxury.com
                </div>
                <div className="p-3 bg-[var(--bg-elevated)] border border-white/5 rounded-xl text-xs font-mono text-gray-300">
                  <span className="text-amber-400">[2023-08-12 09:00 IST]</span> CUSTOMER_CREATED: Unique code RCB-CUST-1001 generated. Actor: admin@luxury.com
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-elevated)] shrink-0">
          <span className="text-xs text-gray-500">
            YAZHINI FINE JEWELS & PAWN SHOP • CRM Record #{customer.customer_code}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-xs transition-colors"
          >
            Close Profile
          </button>
        </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
