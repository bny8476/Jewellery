import React, { useState, useEffect } from 'react';
import { Settings, Download } from 'lucide-react';
import { ROLE_DEFINITIONS, getAuditLogs, AuditLogEntry } from '../../utils/rbac';
import { toast } from '../../utils/toast';
import FormFieldError from '../FormFieldError';
import {
  validateAdminSettings,
  hasErrors,
  firstError
} from '../../utils/adminFormRules';
import { 
  getStoreSettings, 
  saveStoreSettings, 
  getAuditLogsFromDb,
  type StoreProfileConfig 
} from '../../services/retailService';

export const AdminSettingsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'store' | 'tax_pricing' | 'roles' | 'audit' | 'cron'>('store');

  // Store profile state
  const [storeName, setStoreName] = useState("YAZHINI FINE JEWELS & PAWN SHOP");
  const [tagline, setTagline] = useState('TRUST • TRADITION • TIMELESS BEAUTY');
  const [phone, setPhone] = useState('+91 94432 55920');
  const [email, setEmail] = useState('concierge@yazhinifinejewels.in');
  const [address, setAddress] = useState('Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu - 641012');
  const [gstin, setGstin] = useState('33AAACR2938K1Z5');
  const [bisLicence, setBisLicence] = useState('HM/C-762910/2024');

  // Tax & Pricing Rules
  const [gstRate, setGstRate] = useState<number>(3.0);
  const [goldLoanInterest, setGoldLoanInterest] = useState<number>(1.5);
  const [makingChargeBuffer, setMakingChargeBuffer] = useState<number>(8.0);
  const [bisFeePerPiece, setBisFeePerPiece] = useState<number>(45);
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    loadSettings();
    loadAuditTrail();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await getStoreSettings();
      if (s.storeName) setStoreName(s.storeName);
      if (s.tagline) setTagline(s.tagline);
      if (s.phone) setPhone(s.phone);
      if (s.email) setEmail(s.email);
      if (s.address) setAddress(s.address);
      if (s.gstin) setGstin(s.gstin);
      if (s.bisLicence) setBisLicence(s.bisLicence);
      if (s.gstRate !== undefined) setGstRate(s.gstRate);
      if (s.goldLoanInterest !== undefined) setGoldLoanInterest(s.goldLoanInterest);
      if (s.makingChargeBuffer !== undefined) setMakingChargeBuffer(s.makingChargeBuffer);
      if (s.bisFeePerPiece !== undefined) setBisFeePerPiece(s.bisFeePerPiece);
    } catch (err) {
      void err;
    }
  };

  const loadAuditTrail = async () => {
    try {
      const dbLogs = await getAuditLogsFromDb();
      const rawLogs = (dbLogs && dbLogs.length > 0) ? dbLogs : getAuditLogs();
      const seen = new Set<string>();
      const dedupedLogs = rawLogs.filter(l => {
        const idKey = l.id ? String(l.id) : `${l.timestamp}-${l.action}-${l.details}`;
        if (seen.has(idKey)) return false;
        seen.add(idKey);
        return true;
      });
      setAuditLogs(dedupedLogs);
    } catch {
      const rawLogs = getAuditLogs();
      const seen = new Set<string>();
      const dedupedLogs = rawLogs.filter(l => {
        const idKey = l.id ? String(l.id) : `${l.timestamp}-${l.action}-${l.details}`;
        if (seen.has(idKey)) return false;
        seen.add(idKey);
        return true;
      });
      setAuditLogs(dedupedLogs);
    }
  };

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateAdminSettings({
      storeName,
      gstRate,
      goldLoanInterest,
      makingChargeBuffer,
      bisFeePerPiece,
      phone,
      email,
      gstin
    });

    if (hasErrors(errors)) {
      setSettingsErrors(errors);
      const first = firstError(errors);
      if (first) toast.error(first);
      return;
    }
    setSettingsErrors({});

    const config: StoreProfileConfig = {
      storeName, tagline, phone, email, address, gstin, bisLicence,
      gstRate, goldLoanInterest, makingChargeBuffer, bisFeePerPiece
    };
    try {
      await saveStoreSettings(config);
      setSettingsErrors({});
      toast.success('Store profile & tax configurations updated');
    } catch (err: any) {
      toast.error('Failed to save settings: ' + (err.message || 'unknown error'));
    }
  };

  const handleExportAuditLogs = () => {
    const logs = getAuditLogs();
    const headers = ['Timestamp (UTC)', 'Actor Email', 'Role', 'Action', 'Resource', 'Severity', 'Details'];
    const rows = logs.map(l => [
      `"${l.timestamp}"`,
      `"${l.actor_email}"`,
      `"${l.actor_role}"`,
      `"${l.action}"`,
      `"${l.resource}"`,
      `"${l.severity}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rcb_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs downloaded as CSV');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] text-xs font-semibold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Store Configuration &amp; Governance</span>
          </div>
          <h2 className="text-[26px] font-semibold text-[var(--text-main)] tracking-tight admin-page-heading">System Settings, Tax Rules &amp; Security Audits</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Manage business profile, GST tax policies, role permissions, and immutable audit logs.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAuditLogs}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] rounded-lg text-[var(--text-main)] transition-colors"
          >
            <Download className="w-4 h-4 text-[var(--gold-primary)]" />
            <span>Export Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-color)] pb-2 text-xs">
        {[
          { id: 'store', label: 'Store Identity & Legal Details' },
          { id: 'tax_pricing', label: 'GST & Pricing Policies' },
          { id: 'roles', label: 'Role Permissions Matrix' },
          { id: 'audit', label: `Security Audit Trail (${auditLogs.length})` },
          { id: 'cron', label: '9:00 AM Cron Scheduler Status' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all ${
              activeTab === t.id 
                ? 'bg-[var(--gold-primary)] text-black' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Store Profile */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStoreProfile} className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6">
          <h3 className="text-lg font-semibold text-[var(--text-main)] admin-section-heading">Store Identity &amp; Statutory Credentials</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">Business Name *</label>
              <input
                type="text"
                minLength={2}
                value={storeName}
                onChange={(e) => {
                  setStoreName(e.target.value);
                  if (settingsErrors.storeName) {
                    setSettingsErrors(prev => { const n = { ...prev }; delete n.storeName; return n; });
                  }
                }}
                aria-invalid={Boolean(settingsErrors.storeName)}
                className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-lg text-xs font-semibold text-[var(--text-main)] ${
                  settingsErrors.storeName ? 'border-rose-500' : 'border-[var(--border-color)]'
                }`}
              />
              <FormFieldError error={settingsErrors.storeName} />
            </div>

            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">Official Brand Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">GSTIN Registration Number</label>
              <input
                type="text"
                maxLength={15}
                value={gstin}
                onChange={(e) => {
                  setGstin(e.target.value.toUpperCase());
                  if (settingsErrors.gstin) {
                    setSettingsErrors(prev => { const n = { ...prev }; delete n.gstin; return n; });
                  }
                }}
                aria-invalid={Boolean(settingsErrors.gstin)}
                className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-lg text-xs font-mono text-[var(--text-main)] uppercase ${
                  settingsErrors.gstin ? 'border-rose-500' : 'border-[var(--border-color)]'
                }`}
              />
              <FormFieldError error={settingsErrors.gstin} />
            </div>

            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">BIS Hallmarking License Certificate</label>
              <input
                type="text"
                value={bisLicence}
                onChange={(e) => setBisLicence(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)]"
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">Customer Care Phone</label>
              <input
                type="text"
                inputMode="tel"
                maxLength={15}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (settingsErrors.phone) {
                    setSettingsErrors(prev => { const n = { ...prev }; delete n.phone; return n; });
                  }
                }}
                aria-invalid={Boolean(settingsErrors.phone)}
                className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-lg text-xs text-[var(--text-main)] ${
                  settingsErrors.phone ? 'border-rose-500' : 'border-[var(--border-color)]'
                }`}
              />
              <FormFieldError error={settingsErrors.phone} />
            </div>

            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">Official Concierge Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (settingsErrors.email) {
                    setSettingsErrors(prev => { const n = { ...prev }; delete n.email; return n; });
                  }
                }}
                aria-invalid={Boolean(settingsErrors.email)}
                className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-lg text-xs text-[var(--text-main)] ${
                  settingsErrors.email ? 'border-rose-500' : 'border-[var(--border-color)]'
                }`}
              />
              <FormFieldError error={settingsErrors.email} />
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">Registered Showroom Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-[var(--gold-primary)] text-black rounded-xl text-xs font-bold hover:brightness-105 active:scale-95 shadow"
            >
              Save Store Profile
            </button>
          </div>
        </form>
      )}

      {/* Tab: Tax & Pricing Rules */}
      {activeTab === 'tax_pricing' && (
        <form onSubmit={handleSaveStoreProfile} className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6">
          <h3 className="text-lg font-semibold text-[var(--text-main)] admin-section-heading">Taxation, Making Charge &amp; Pawn Loan Terms</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2">
              <label className="font-bold text-[var(--text-main)] block">Goods &amp; Services Tax (GST) Rate</label>
              <p className="text-[11px] text-[var(--text-secondary)]">Indian Standard statutory GST for Gold, Silver &amp; Precious Jewellery (0% - 28%).</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="28"
                  value={gstRate}
                  onChange={(e) => {
                    setGstRate(Number(e.target.value));
                    if (settingsErrors.gstRate) {
                      setSettingsErrors(prev => { const n = { ...prev }; delete n.gstRate; return n; });
                    }
                  }}
                  aria-invalid={Boolean(settingsErrors.gstRate)}
                  className={`w-24 px-3 py-1.5 bg-[var(--bg-card)] border rounded text-xs font-mono font-bold text-[var(--gold-primary)] ${
                    settingsErrors.gstRate ? 'border-rose-500' : 'border-[var(--border-color)]'
                  }`}
                />
                <span className="font-bold text-xs">%</span>
              </div>
              <FormFieldError error={settingsErrors.gstRate} />
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2">
              <label className="font-bold text-[var(--text-main)] block">Default Pawn Loan Monthly Interest Rate</label>
              <p className="text-[11px] text-[var(--text-secondary)]">Standard benchmark monthly interest rate applied on gold collateral advances (0% - 100%).</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="100"
                  value={goldLoanInterest}
                  onChange={(e) => {
                    setGoldLoanInterest(Number(e.target.value));
                    if (settingsErrors.goldLoanInterest) {
                      setSettingsErrors(prev => { const n = { ...prev }; delete n.goldLoanInterest; return n; });
                    }
                  }}
                  aria-invalid={Boolean(settingsErrors.goldLoanInterest)}
                  className={`w-24 px-3 py-1.5 bg-[var(--bg-card)] border rounded text-xs font-mono font-bold text-[var(--gold-primary)] ${
                    settingsErrors.goldLoanInterest ? 'border-rose-500' : 'border-[var(--border-color)]'
                  }`}
                />
                <span className="font-bold text-xs">% per month (18% p.a.)</span>
              </div>
              <FormFieldError error={settingsErrors.goldLoanInterest} />
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2">
              <label className="font-bold text-[var(--text-main)] block">Standard Wastage &amp; Making Charge Margin</label>
              <p className="text-[11px] text-[var(--text-secondary)]">Default showroom handcrafted filigree and casting charge buffer (0% - 100%).</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={makingChargeBuffer}
                  onChange={(e) => {
                    setMakingChargeBuffer(Number(e.target.value));
                    if (settingsErrors.makingChargeBuffer) {
                      setSettingsErrors(prev => { const n = { ...prev }; delete n.makingChargeBuffer; return n; });
                    }
                  }}
                  aria-invalid={Boolean(settingsErrors.makingChargeBuffer)}
                  className={`w-24 px-3 py-1.5 bg-[var(--bg-card)] border rounded text-xs font-mono font-bold text-[var(--gold-primary)] ${
                    settingsErrors.makingChargeBuffer ? 'border-rose-500' : 'border-[var(--border-color)]'
                  }`}
                />
                <span className="font-bold text-xs">% on metal spot</span>
              </div>
              <FormFieldError error={settingsErrors.makingChargeBuffer} />
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2">
              <label className="font-bold text-[var(--text-main)] block">BIS Hallmarking Certification Fee</label>
              <p className="text-[11px] text-[var(--text-secondary)]">Statutory fee charged per gold article for laser HUID engraving (₹0 - ₹1,000).</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="1"
                  value={bisFeePerPiece}
                  onChange={(e) => {
                    setBisFeePerPiece(Number(e.target.value));
                    if (settingsErrors.bisFeePerPiece) {
                      setSettingsErrors(prev => { const n = { ...prev }; delete n.bisFeePerPiece; return n; });
                    }
                  }}
                  aria-invalid={Boolean(settingsErrors.bisFeePerPiece)}
                  className={`w-24 px-3 py-1.5 bg-[var(--bg-card)] border rounded text-xs font-mono font-bold text-[var(--gold-primary)] ${
                    settingsErrors.bisFeePerPiece ? 'border-rose-500' : 'border-[var(--border-color)]'
                  }`}
                />
                <span className="text-xs text-[var(--text-secondary)]">per article</span>
              </div>
              <FormFieldError error={settingsErrors.bisFeePerPiece} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-[var(--gold-primary)] text-black rounded-xl text-xs font-bold hover:brightness-105 active:scale-95 shadow"
            >
              Update Pricing Rules
            </button>
          </div>
        </form>
      )}

      {/* Tab: Roles & Permission Matrix */}
      {activeTab === 'roles' && (
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-main)] admin-section-heading">7-Tier Role-Based Security Matrix</h3>
              <p className="text-xs text-[var(--text-secondary)]">Enforces granular access control across storefront, vaults, POS, ledgers and reports.</p>
            </div>
            <span className="text-[10px] uppercase font-bold text-[var(--gold-primary)] px-2.5 py-1 rounded bg-[var(--gold-primary)]/10">
              Active Security Guard
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(ROLE_DEFINITIONS).map(role => (
              <div key={role.id} className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span 
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: role.badgeBg, color: role.color }}
                  >
                    {role.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">{role.allowedTabs.length} Modules</span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{role.description}</p>

                <div className="border-t border-[var(--border-color)] pt-2">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-1">Permitted Workspaces:</span>
                  <div className="flex flex-wrap gap-1">
                    {role.allowedTabs.slice(0, 6).map(tab => (
                      <span key={tab} className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[9px] text-[var(--text-main)] font-mono">
                        {tab}
                      </span>
                    ))}
                    {role.allowedTabs.length > 6 && (
                      <span className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[9px] text-[var(--text-secondary)] font-mono">
                        +{role.allowedTabs.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-main)]">Immutable Activity &amp; Security Logs</h3>
            <span className="text-[10px] text-[var(--text-secondary)] font-mono">Showing {auditLogs.length} events</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase text-[10px] tracking-wider border-b border-[var(--border-color)]">
                <tr>
                  <th className="py-2.5 px-4">Timestamp (IST)</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Resource</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4 text-center">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] font-mono text-[11px]">
                {auditLogs.map((l, index) => (
                  <tr key={l.id ? `${l.id}-${index}` : `audit-log-${index}`} className="hover:bg-[var(--bg-elevated)]/50">
                    <td className="py-2.5 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-2.5 px-4 text-[var(--text-main)] font-sans">{l.actor_email} ({l.actor_role})</td>
                    <td className="py-2.5 px-4 font-bold text-[var(--gold-primary)]">{l.action}</td>
                    <td className="py-2.5 px-4 text-[var(--text-secondary)]">{l.resource}</td>
                    <td className="py-2.5 px-4 text-[var(--text-main)] font-sans max-w-xs truncate">{l.details}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                        l.severity === 'info' ? 'bg-sky-500/10 text-sky-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {l.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Daily Cron Scheduler Status */}
      {activeTab === 'cron' && (
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-main)] admin-section-heading">9:00 AM IST Daily Rates Cron Job</h3>
              <p className="text-xs text-[var(--text-secondary)]">Automated bullion market rate update pipeline via GoldAPI.io</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Cron Pipeline Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Scheduled Execution</span>
              <p className="text-sm font-bold text-[var(--text-main)]">9:00 AM India Standard Time</p>
              <p className="text-[11px] text-[var(--text-secondary)] font-mono">03:30 UTC Daily (Cron: 30 3 * * *)</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">API Provider</span>
              <p className="text-sm font-bold text-[var(--gold-primary)]">GoldAPI.io Spot Bullion</p>
              <p className="text-[11px] text-[var(--text-secondary)] font-mono">XAU, XAG, XPT in INR</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Zero-Cost Visitor Serving</span>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">1 Request / Day Total</p>
              <p className="text-[11px] text-[var(--text-secondary)]">All visitors served from saved snapshots</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs space-y-2">
            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Cron Serverless Endpoint:</span>
            <code className="text-xs font-mono bg-stone-900 text-stone-100 dark:bg-black/70 dark:text-stone-100 px-3 py-2.5 rounded-lg border border-stone-700/80 dark:border-stone-800 block overflow-x-auto select-all shadow-xs">
              <span className="text-emerald-400 font-bold">GET</span>{' '}
              <span className="text-amber-300 font-bold">/api/cron-update-metal-rates</span>{' '}
              <span className="text-stone-300 font-normal">(Authorization: Bearer CRON_SECRET)</span>
            </code>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Configured via <span className="font-mono text-[var(--text-main)] font-semibold">vercel.json</span> and GitHub Actions workflow for redundant high availability.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsSection;
