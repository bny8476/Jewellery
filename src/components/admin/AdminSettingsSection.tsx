import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, FileText, Database, Clock, 
  Check, Save, Download, RefreshCw, AlertTriangle, Key, Users
} from 'lucide-react';
import { ROLE_DEFINITIONS, getAuditLogs, AuditLogEntry, AdminRole } from '../../utils/rbac';
import { toast } from '../../utils/toast';

export const AdminSettingsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'store' | 'tax_pricing' | 'roles' | 'audit' | 'cron'>('store');

  // Store profile state
  const [storeName, setStoreName] = useState("RCB JEWELRY'S & PAWN SHOP");
  const [tagline, setTagline] = useState('TRUST • TRADITION • TIMELESS BEAUTY');
  const [phone, setPhone] = useState('+91 94432 55920');
  const [email, setEmail] = useState('concierge@rcbjewelry.in');
  const [address, setAddress] = useState('Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu - 641012');
  const [gstin, setGstin] = useState('33AAACR2938K1Z5');
  const [bisLicence, setBisLicence] = useState('HM/C-762910/2024');

  // Tax & Pricing Rules
  const [gstRate, setGstRate] = useState<number>(3.0);
  const [goldLoanInterest, setGoldLoanInterest] = useState<number>(1.5);
  const [makingChargeBuffer, setMakingChargeBuffer] = useState<number>(8.0);
  const [bisFeePerPiece, setBisFeePerPiece] = useState<number>(45);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState('all');

  useEffect(() => {
    loadSettings();
    setAuditLogs(getAuditLogs());
  }, []);

  const loadSettings = () => {
    try {
      const raw = localStorage.getItem('rcb_store_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.storeName) setStoreName(s.storeName);
        if (s.tagline) setTagline(s.tagline);
        if (s.phone) setPhone(s.phone);
        if (s.email) setEmail(s.email);
        if (s.address) setAddress(s.address);
        if (s.gstin) setGstin(s.gstin);
        if (s.bisLicence) setBisLicence(s.bisLicence);
        if (s.gstRate) setGstRate(s.gstRate);
        if (s.goldLoanInterest) setGoldLoanInterest(s.goldLoanInterest);
      }
    } catch {}
  };

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      storeName, tagline, phone, email, address, gstin, bisLicence,
      gstRate, goldLoanInterest, makingChargeBuffer, bisFeePerPiece
    };
    localStorage.setItem('rcb_store_settings', JSON.stringify(config));
    toast.success('Store profile & tax configurations updated');
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
          <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">System Settings, Tax Rules &amp; Security Audits</h2>
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
          <h3 className="text-base font-serif font-bold text-[var(--text-main)]">Store Identity &amp; Statutory Credentials</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">Business Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-main)]"
              />
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
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] uppercase"
              />
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">Official Concierge Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
              />
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
          <h3 className="text-base font-serif font-bold text-[var(--text-main)]">Taxation, Making Charge &amp; Pawn Loan Terms</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2">
              <label className="font-bold text-[var(--text-main)] block">Goods &amp; Services Tax (GST) Rate</label>
              <p className="text-[11px] text-[var(--text-secondary)]">Indian Standard statutory GST for Gold, Silver &amp; Precious Jewellery.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-xs font-mono font-bold text-[var(--gold-primary)]"
                />
                <span className="font-bold text-xs">%</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2">
              <label className="font-bold text-[var(--text-main)] block">Default Pawn Loan Monthly Interest Rate</label>
              <p className="text-[11px] text-[var(--text-secondary)]">Standard benchmark monthly interest rate applied on gold collateral advances.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  value={goldLoanInterest}
                  onChange={(e) => setGoldLoanInterest(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-xs font-mono font-bold text-[var(--gold-primary)]"
                />
                <span className="font-bold text-xs">% per month (18% p.a.)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2">
              <label className="font-bold text-[var(--text-main)] block">Standard Wastage &amp; Making Charge Margin</label>
              <p className="text-[11px] text-[var(--text-secondary)]">Default showroom handcrafted filigree and casting charge buffer.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={makingChargeBuffer}
                  onChange={(e) => setMakingChargeBuffer(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-xs font-mono font-bold text-[var(--gold-primary)]"
                />
                <span className="font-bold text-xs">% on metal spot</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2">
              <label className="font-bold text-[var(--text-main)] block">BIS Hallmarking Certification Fee</label>
              <p className="text-[11px] text-[var(--text-secondary)]">Statutory fee charged per gold article for laser HUID engraving.</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={bisFeePerPiece}
                  onChange={(e) => setBisFeePerPiece(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-xs font-mono font-bold text-[var(--gold-primary)]"
                />
                <span className="text-xs text-[var(--text-secondary)]">per article</span>
              </div>
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
              <h3 className="text-base font-serif font-bold text-[var(--text-main)]">7-Tier Role-Based Security Matrix</h3>
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
                {auditLogs.map(l => (
                  <tr key={l.id} className="hover:bg-[var(--bg-elevated)]/50">
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
              <h3 className="text-base font-serif font-bold text-[var(--text-main)]">9:00 AM IST Daily Rates Cron Job</h3>
              <p className="text-xs text-[var(--text-secondary)]">Automated bullion market rate update pipeline via GoldAPI.io</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
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
              <p className="text-sm font-bold text-emerald-400">1 Request / Day Total</p>
              <p className="text-[11px] text-[var(--text-secondary)]">All visitors served from saved snapshots</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs space-y-2">
            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Cron Serverless Endpoint:</span>
            <code className="text-xs text-[var(--gold-primary)] font-mono bg-black/40 px-2 py-1 rounded block overflow-x-auto">
              GET /api/cron-update-metal-rates (Authorization: Bearer CRON_SECRET)
            </code>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Configured via <span className="font-mono text-[var(--text-main)]">vercel.json</span> and GitHub Actions workflow for redundant high availability.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsSection;
