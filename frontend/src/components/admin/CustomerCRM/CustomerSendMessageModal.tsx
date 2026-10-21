import React, { useState } from 'react';
import { X, Send, MessageSquare, Mail, Phone } from 'lucide-react';
import type { Customer } from '../../../types/pawnshop';
import { sendCustomerMessage } from '../../../services/customerService';
import { toast } from '../../../utils/toast';
import FormFieldError from '../../FormFieldError';
import {
  validateCustomerSendMessage,
  hasErrors,
  firstError
} from '../../../utils/adminFormRules';

interface CustomerSendMessageModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onMessageSent: () => void;
}

export const CustomerSendMessageModal: React.FC<CustomerSendMessageModalProps> = ({
  isOpen,
  customer,
  onClose,
  onMessageSent
}) => {
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [template, setTemplate] = useState('custom');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [msgErrors, setMsgErrors] = useState<Record<string, string>>({});

  if (!isOpen || !customer) return null;

  const handleTemplateChange = (tpl: string) => {
    setTemplate(tpl);
    if (tpl === 'invoice') {
      setSubject('YAZHINI Fine Jewels — Your Official Tax Invoice & BIS Hallmark Certificate');
      setMessage(`Dear ${customer.full_name},\n\nThank you for choosing YAZHINI FINE JEWELS & PAWN SHOP. Your BIS Hallmarked jewellery tax invoice has been generated. You can view and download your verified documents via your patron portal.\n\nWarm regards,\nYAZHINI Fine Jewels Team\nTrust • Tradition • Timeless Beauty`);
    } else if (tpl === 'pawn_reminder') {
      setSubject('Statutory Reminder: Pawn Loan Interest Due');
      setMessage(`Dear ${customer.full_name},\n\nThis is a friendly reminder from YAZHINI Fine Jewels & Pawn Shop that the monthly interest cycle for your pledged gold article is approaching its scheduled renewal date. Kindly settle via UPI or visit our branch to keep your account in good standing.\n\nHelpline: +91 98401 23456`);
    } else if (tpl === 'birthday') {
      setSubject('Warm Birthday Greetings from YAZHINI Fine Jewels!');
      setMessage(`Dear ${customer.full_name},\n\nOn behalf of the entire YAZHINI family, we wish you a joyous and blessed Birthday! As our cherished patron, please enjoy a complimentary 25% waiver on making charges on any bridal or gold purchase this month.\n\nExclusive Promo: YAZHINI-BDAY-GOLD`);
    } else if (tpl === 'valuation') {
      setSubject('Gold & Solitaire Valuation Consultation Confirmed');
      setMessage(`Dear ${customer.full_name},\n\nYour private valuation consultation at our boutique has been reserved. Our senior gemologist and bullion appraisers look forward to hosting you.\n\nAddress: YAZHINI Fine Jewels Suite, Chennai`);
    } else {
      setSubject('');
      setMessage('');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateCustomerSendMessage({
      channel,
      message,
      subject
    });

    if (hasErrors(errs)) {
      setMsgErrors(errs);
      const first = firstError(errs);
      if (first) toast.error(first);
      return;
    }
    setMsgErrors({});

    try {
      setIsSending(true);
      await sendCustomerMessage({
        customer_id: customer.id,
        channel,
        subject: subject || `${channel.toUpperCase()} Notification`,
        message: message.trim(),
        logged_by: 'admin@luxury.com'
      });

      toast.success(`Message dispatched to ${customer.full_name} via ${channel.toUpperCase()}`);
      setMsgErrors({});
      onMessageSent();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[var(--bg-card)] border border-[var(--gold-primary)]/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] border border-[var(--gold-primary)]/30">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-main)]">Send Client Communication</h3>
              <p className="text-xs text-[var(--text-secondary)]">{customer.full_name} • {customer.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4 text-xs">
          {/* Channel selector */}
          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Delivery Channel</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border text-xs transition-colors ${
                  channel === 'whatsapp'
                    ? 'bg-emerald-600 border-emerald-600 text-white font-medium shadow-xs'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border text-xs transition-colors ${
                  channel === 'sms'
                    ? 'bg-amber-500 border-amber-500 text-black font-medium shadow-xs'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>SMS Alert</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border text-xs transition-colors ${
                  channel === 'email'
                    ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-xs'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </button>
            </div>
          </div>

          {/* Template presets */}
          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Pre-Configured Template</label>
            <select
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]/60"
            >
              <option value="custom">-- Custom Message --</option>
              <option value="invoice">Tax Invoice &amp; BIS Hallmark Notice</option>
              <option value="pawn_reminder">Pawn Loan Interest Due Reminder</option>
              <option value="birthday">Birthday &amp; Anniversary Greeting (Offer)</option>
              <option value="valuation">Private Suite Valuation Appointment</option>
            </select>
          </div>

          {/* Subject */}
          {channel === 'email' && (
            <div>
              <label className="block text-[var(--text-secondary)] font-medium mb-1">Email Subject *</label>
              <input
                type="text"
                minLength={2}
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (msgErrors.subject) {
                    setMsgErrors(prev => { const n = { ...prev }; delete n.subject; return n; });
                  }
                }}
                placeholder="Enter email subject"
                aria-invalid={Boolean(msgErrors.subject)}
                className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-xl text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]/60 ${
                  msgErrors.subject ? 'border-rose-500' : 'border-[var(--border-color)]'
                }`}
              />
              <FormFieldError error={msgErrors.subject} />
            </div>
          )}

          {/* Message Textarea */}
          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1">Message Body *</label>
            <textarea
              rows={5}
              minLength={3}
              maxLength={1000}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (msgErrors.message) {
                  setMsgErrors(prev => { const n = { ...prev }; delete n.message; return n; });
                }
              }}
              placeholder="Type message text here..."
              aria-invalid={Boolean(msgErrors.message)}
              className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-xl text-[var(--text-main)] font-sans text-xs focus:outline-none focus:border-[var(--gold-primary)]/60 resize-none ${
                msgErrors.message ? 'border-rose-500' : 'border-[var(--border-color)]'
              }`}
            />
            <FormFieldError error={msgErrors.message} />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-muted)]">
              Consent: {customer.communication_consent?.whatsapp ? '✓ WhatsApp Approved' : 'Direct Consent'}
            </span>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending || !message.trim()}
                className="flex items-center space-x-1.5 px-5 py-2 bg-[var(--gold-primary)] hover:brightness-105 text-stone-900 font-semibold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(198,161,91,0.3)] disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Dispatch Message'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
