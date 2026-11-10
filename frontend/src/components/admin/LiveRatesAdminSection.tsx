import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity, ShieldCheck, RefreshCw,
  Database, Clock, Sliders, Zap, Gem, Check, ArrowUpRight, Calendar
} from 'lucide-react';
import { useRates } from '../../context/RateContext';
import { toast } from '../../utils/toast';
import { supabase } from '../../lib/supabase';
import FormFieldError from '../FormFieldError';
import {
  validateLiveRateAdjustments,
  hasErrors,
  firstError
} from '../../utils/adminFormRules';
import { platformSyncService } from '../../services/platformSyncService';
import { BACKEND_URL } from '../../config/api';

interface AdminSettings {
  activeProvider: string;
  refreshIntervalMinutes: number;
  cacheTtlMinutes: number;
  goldAdjustmentPerGram: number;
  silverAdjustmentPerGram: number;
  platinumAdjustmentPerGram: number;
  updatedAt: string;
  updatedBy: string;
}

interface AuditRecord {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

interface ConnectivityStatus {
  connected: boolean;
  latencyMs: number;
  provider: string;
  httpStatus: number;
  message: string;
}

const GoldBarsIllustration: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 56" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(2, 2)">
      {/* Bottom-left Bar */}
      <g>
        <polygon points="6,28 24,18 38,23 20,33" fill="#E8C360" stroke="#C88E28" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="6,28 20,33 20,41 6,36" fill="#C69224" stroke="#C88E28" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="20,33 38,23 38,31 20,41" fill="#DCAB36" stroke="#C88E28" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      {/* Bottom-right Bar */}
      <g>
        <polygon points="24,35 42,25 56,30 38,40" fill="#E8C360" stroke="#C88E28" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="24,35 38,40 38,48 24,43" fill="#C69224" stroke="#C88E28" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="38,40 56,30 56,38 38,48" fill="#DCAB36" stroke="#C88E28" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      {/* Top Bar (resting on bottom two) */}
      <g>
        <polygon points="15,16 33,6 47,11 29,21" fill="#F4D883" stroke="#C88E28" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="15,16 29,21 29,29 15,24" fill="#CF9A2A" stroke="#C88E28" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="29,21 47,11 47,19 29,29" fill="#E5B942" stroke="#C88E28" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const LiveRatesAdminSection: React.FC = () => {
  const { detailedRates, istTime, refreshRates } = useRates();

  const [settings, setSettings] = useState<AdminSettings>({
    activeProvider: 'goldapi',
    refreshIntervalMinutes: 15,
    cacheTtlMinutes: 15,
    goldAdjustmentPerGram: 0,
    silverAdjustmentPerGram: 0,
    platinumAdjustmentPerGram: 0,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  });

  const [auditLog, setAuditLog] = useState<AuditRecord[]>([]);
  const [connectivity, setConnectivity] = useState<ConnectivityStatus | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [refreshingRates, setRefreshingRates] = useState(false);
  const [rateErrors, setRateErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<AdminSettings>(settings);

  useEffect(() => {
    loadAdminData();
    testConnection(false);
  }, []);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return { 'Authorization': `Bearer ${session.access_token}` };
      }
    } catch {
      // Ignore session fetch failure and proceed with empty headers
    }
    return {};
  };

  const loadAdminData = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/metal-rates/admin`, { headers: authHeaders });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          setFormData(data.settings);
        }
        if (data.auditLog) {
          setAuditLog(data.auditLog);
        }
      }
    } catch (err) {
      console.warn('Failed to load admin rates settings:', err);
    }
  };

  const testConnection = async (showToast = true) => {
    setTestingConnection(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/metal-rates/admin/test`, { headers: authHeaders });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setConnectivity(data);
        if (showToast) {
          if (data.connected) {
            toast.success(`GoldAPI.io ping healthy (${data.latencyMs}ms)`);
          } else {
            toast.error(`Connection check failed: ${data.message}`);
          }
        }
      }
    } catch {
      if (showToast) {
        toast.error('Network failure connecting to GoldAPI.io test endpoint');
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const handleManualSync = async () => {
    setRefreshingRates(true);
    try {
      const authHeaders = await getAuthHeaders();
      const cronRes = await fetch(`${BACKEND_URL}/api/cron-update-metal-rates?force=true`, { headers: authHeaders });
      if (cronRes.ok) {
        await refreshRates();
        toast.success('9:00 AM IST daily rates successfully updated & locked in database!');
      } else {
        await refreshRates();
        toast.info('Fetched latest stored daily rates');
      }
      platformSyncService.broadcast('all', 'refresh', 'metal_rate', { timestamp: new Date().toISOString() });
      loadAdminData();
    } catch {
      toast.error('Failed to trigger daily rates update');
    } finally {
      setRefreshingRates(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateLiveRateAdjustments({
      goldAdjustmentPerGram: formData.goldAdjustmentPerGram,
      silverAdjustmentPerGram: formData.silverAdjustmentPerGram,
      platinumAdjustmentPerGram: formData.platinumAdjustmentPerGram,
      refreshIntervalMinutes: formData.refreshIntervalMinutes,
      cacheTtlMinutes: formData.cacheTtlMinutes
    });

    if (hasErrors(errs)) {
      setRateErrors(errs);
      const first = firstError(errs);
      if (first) toast.error(first);
      return;
    }
    setRateErrors({});

    setSavingSettings(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/metal-rates/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          settings: formData
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setSettings(data.settings);
        setRateErrors({});
        platformSyncService.broadcast('all', 'update', 'metal_rate', formData);
        toast.success('Metal pricing adjustments & API policies saved!');
        loadAdminData();
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Error contacting server');
    } finally {
      setSavingSettings(false);
    }
  };

  const effectiveDateDisplay = useMemo(() => {
    if (detailedRates?.metadata?.displayNotice) {
      return detailedRates.metadata.displayNotice;
    }
    const ts = detailedRates?.metadata?.timestamp || detailedRates?.metadata?.effectiveDate;
    if (ts) {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} at 9:00 AM IST`;
      }
    }
    if (istTime) {
      return istTime;
    }
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} at 9:00 AM IST`;
  }, [detailedRates, istTime]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls: Exact Match to Reference Design */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl p-6 sm:p-7 border border-[#EBE6DF] dark:border-neutral-800 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Left Brand Identity with 3D Gold Bars */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#FFF8ED] dark:bg-[#201A12] border border-[#F3E7D3] dark:border-amber-900/30 flex items-center justify-center p-2.5 shrink-0 shadow-2xs">
              <GoldBarsIllustration className="w-12 h-12 sm:w-14 sm:h-14" />
            </div>

            <div className="hidden sm:block w-[2px] h-12 bg-[#D4AF37] dark:bg-amber-500 rounded-full shrink-0 self-center" />

            <div>
              <h2 className="text-xl sm:text-[22px] font-bold text-neutral-900 dark:text-white tracking-tight">
                Live Bullion &amp; Diamond API Control Hub
              </h2>
              <p className="text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 font-normal mt-0.5">
                Real-time GoldAPI.io IDC/LBMA connection • India (INR) Multi-Purity Engine
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3 sm:gap-3.5 flex-wrap shrink-0">
            {/* Button 1: Test Latency */}
            <button
              onClick={() => testConnection(true)}
              disabled={testingConnection}
              type="button"
              className="bg-[#FFF8ED] hover:bg-[#FDF2DE] dark:bg-[#1E1912] dark:hover:bg-[#282015] border border-[#F3E7D3] dark:border-amber-900/30 rounded-2xl px-5 py-3 flex items-center gap-3.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
            >
              <Zap className={`w-5 h-5 text-[#C88E28] shrink-0 ${testingConnection ? 'animate-bounce' : ''}`} />
              <div className="text-left">
                <span className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 leading-tight">
                  {testingConnection ? 'Testing...' : 'Test Latency'}
                </span>
                <span className="block text-sm font-extrabold text-neutral-900 dark:text-white font-mono leading-tight mt-0.5">
                  {connectivity?.latencyMs ? `${connectivity.latencyMs}ms` : '< 250ms'}
                </span>
              </div>
            </button>

            {/* Button 2: Trigger 9:00 AM IST Sync */}
            <button
              onClick={handleManualSync}
              disabled={refreshingRates}
              type="button"
              className="bg-[#FFF8ED] hover:bg-[#FDF2DE] dark:bg-[#1E1912] dark:hover:bg-[#282015] border border-[#F3E7D3] dark:border-amber-900/30 rounded-2xl px-5 py-3.5 flex items-center gap-2.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-[#C88E28] shrink-0 ${refreshingRates ? 'animate-spin' : ''}`} />
              <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                {refreshingRates ? 'Updating...' : 'Trigger 9:00 AM IST Sync'}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Bottom KPI Indicator Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-6">
          {/* Card 1: ACTIVE PROVIDER */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-[#EBE6DF] dark:border-neutral-800 p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
            <ShieldCheck className="w-8 h-8 text-[#C88E28] shrink-0 stroke-[1.75]" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                ACTIVE PROVIDER
              </p>
              <p className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight mt-0.5 truncate">
                GoldAPI.io
              </p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#047857] dark:text-emerald-400 border border-[#A7F3D0] dark:border-emerald-800/40 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Connected
              </span>
            </div>
          </div>

          {/* Card 2: API HEALTH & LATENCY */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-[#EBE6DF] dark:border-neutral-800 p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
            <Activity className="w-8 h-8 text-[#C88E28] shrink-0 stroke-[1.75]" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                API HEALTH &amp; LATENCY
              </p>
              {testingConnection || !connectivity ? (
                <>
                  <p className="text-base sm:text-lg font-bold text-[#D97706] dark:text-amber-400 leading-tight mt-0.5">
                    Checking...
                  </p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">Please wait</p>
                </>
              ) : connectivity.connected ? (
                <>
                  <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
                    Healthy
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                    {connectivity.latencyMs}ms (Optimal)
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 leading-tight mt-0.5">
                    Offline
                  </p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">Reconnect API</p>
                </>
              )}
            </div>
          </div>

          {/* Card 3: EFFECTIVE SESSION (IST) */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-[#EBE6DF] dark:border-neutral-800 p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
            <Calendar className="w-8 h-8 text-[#C88E28] shrink-0 stroke-[1.75]" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                EFFECTIVE SESSION (IST)
              </p>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium leading-snug mt-0.5">
                Rates last updated on
              </p>
              <p className="text-xs font-bold text-neutral-900 dark:text-white leading-snug mt-0.5">
                {effectiveDateDisplay}
              </p>
            </div>
          </div>

          {/* Card 4: UPDATE POLICY */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-[#EBE6DF] dark:border-neutral-800 p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
            <Clock className="w-8 h-8 text-[#C88E28] shrink-0 stroke-[1.75]" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                UPDATE POLICY
              </p>
              <p className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight mt-0.5">
                9:00 AM IST
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FFF8ED] dark:bg-[#201A12] text-neutral-600 dark:text-neutral-300 border border-[#F3E7D3] dark:border-amber-900/30 mt-1.5">
                (Once Daily)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form & Diamond Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-[var(--text-main)]">Shop Spread & Rate Policy Controls</h3>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">Live rate override adjustments</span>
            </div>

            {/* Shop Adjustments (Margin) */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Store-Specific Price Spread (₹ per gram adjustment)
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Add an optional shop spread or premium on top of international LBMA base quotes (positive or negative value in ₹/g).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <label className="text-xs font-semibold text-[var(--text-main)] block mb-1">Gold 24K Spread</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-[var(--text-secondary)]">₹</span>
                    <input
                      type="number"
                      min="-5000"
                      max="5000"
                      step="1"
                      value={formData.goldAdjustmentPerGram}
                      onChange={(e) => {
                        setFormData({ ...formData, goldAdjustmentPerGram: Number(e.target.value) });
                        if (rateErrors.goldAdjustmentPerGram) {
                          setRateErrors(prev => { const n = { ...prev }; delete n.goldAdjustmentPerGram; return n; });
                        }
                      }}
                      aria-invalid={Boolean(rateErrors.goldAdjustmentPerGram)}
                      className={`w-full bg-[var(--bg-card)] border rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--text-main)] ${
                        rateErrors.goldAdjustmentPerGram ? 'border-rose-500' : 'border-[var(--border-color)]'
                      }`}
                      placeholder="0"
                    />
                    <span className="text-xs text-[var(--text-secondary)]">/g</span>
                  </div>
                  <FormFieldError error={rateErrors.goldAdjustmentPerGram} />
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">
                    Effective 24K: ₹{((detailedRates?.gold?.k24?.ratePerGram || 0) + formData.goldAdjustmentPerGram).toLocaleString('en-IN')}/g
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <label className="text-xs font-semibold text-[var(--text-main)] block mb-1">Silver Spread</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-[var(--text-secondary)]">₹</span>
                    <input
                      type="number"
                      min="-500"
                      max="500"
                      step="1"
                      value={formData.silverAdjustmentPerGram}
                      onChange={(e) => {
                        setFormData({ ...formData, silverAdjustmentPerGram: Number(e.target.value) });
                        if (rateErrors.silverAdjustmentPerGram) {
                          setRateErrors(prev => { const n = { ...prev }; delete n.silverAdjustmentPerGram; return n; });
                        }
                      }}
                      aria-invalid={Boolean(rateErrors.silverAdjustmentPerGram)}
                      className={`w-full bg-[var(--bg-card)] border rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--text-main)] ${
                        rateErrors.silverAdjustmentPerGram ? 'border-rose-500' : 'border-[var(--border-color)]'
                      }`}
                      placeholder="0"
                    />
                    <span className="text-xs text-[var(--text-secondary)]">/g</span>
                  </div>
                  <FormFieldError error={rateErrors.silverAdjustmentPerGram} />
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">
                    Effective Silver: ₹{((detailedRates?.silver?.ratePerGram || 0) + formData.silverAdjustmentPerGram).toLocaleString('en-IN')}/g
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <label className="text-xs font-semibold text-[var(--text-main)] block mb-1">Platinum Spread</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-[var(--text-secondary)]">₹</span>
                    <input
                      type="number"
                      min="-5000"
                      max="5000"
                      step="1"
                      value={formData.platinumAdjustmentPerGram}
                      onChange={(e) => {
                        setFormData({ ...formData, platinumAdjustmentPerGram: Number(e.target.value) });
                        if (rateErrors.platinumAdjustmentPerGram) {
                          setRateErrors(prev => { const n = { ...prev }; delete n.platinumAdjustmentPerGram; return n; });
                        }
                      }}
                      aria-invalid={Boolean(rateErrors.platinumAdjustmentPerGram)}
                      className={`w-full bg-[var(--bg-card)] border rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--text-main)] ${
                        rateErrors.platinumAdjustmentPerGram ? 'border-rose-500' : 'border-[var(--border-color)]'
                      }`}
                      placeholder="0"
                    />
                    <span className="text-xs text-[var(--text-secondary)]">/g</span>
                  </div>
                  <FormFieldError error={rateErrors.platinumAdjustmentPerGram} />
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">
                    Effective Platinum: ₹{((detailedRates?.platinum?.ratePerGram || 0) + formData.platinumAdjustmentPerGram).toLocaleString('en-IN')}/g
                  </p>
                </div>
              </div>
            </div>

            {/* Provider Policy & Refresh Intervals */}
            <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Provider & Caching Optimization
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-main)] block mb-1.5">Active Bullion Provider</label>
                  <select
                    value={formData.activeProvider}
                    onChange={(e) => setFormData({ ...formData, activeProvider: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-sm text-[var(--text-main)] font-medium"
                  >
                    <option value="goldapi">GoldAPI.io (Live Spot Feed - Active)</option>
                    <option value="metals_dev">Metals.Dev (Secondary Alternative)</option>
                    <option value="manual">Manual Shop Override Mode</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-main)] block mb-1.5">Server Cache Duration (TTL)</label>
                  <select
                    value={formData.cacheTtlMinutes}
                    onChange={(e) => setFormData({ ...formData, cacheTtlMinutes: Number(e.target.value) })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-sm text-[var(--text-main)] font-medium"
                  >
                    <option value="5">5 Minutes (High Frequency)</option>
                    <option value="15">15 Minutes (Recommended - Free Tier Safe)</option>
                    <option value="30">30 Minutes (Quota Saver)</option>
                    <option value="60">60 Minutes (Hourly Snapshot)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-main)] block">Server-Side Security Enforced</span>
                API credentials are strictly housed in server environment variables (`GOLD_API_KEY`) and never transmitted to the browser or embedded into client-side build scripts.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl border border-amber-500 text-amber-500 dark:text-amber-400 bg-transparent hover:bg-gradient-to-r hover:from-amber-400 hover:via-amber-500 hover:to-amber-600 hover:text-black hover:border-amber-400 hover:shadow-md font-bold text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all duration-200"
              >
                {savingSettings ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>Save Rate Policy &amp; Adjustments</span>
              </button>
            </div>
          </form>

          {/* Diamond Valuation Parameters Reference */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <Gem className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-bold text-[var(--text-main)]">Diamond Reference Matrix Calibration</h3>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">Rapaport Specification Grid</span>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-[var(--text-secondary)]">
                YAZHINI FINE JEWELS' diamond estimator utilizes the international Rapaport wholesale pricing benchmark calibrated to Indian INR retail exchange rates.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-center">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase">Lab-Grown Discount</p>
                  <p className="text-base font-bold text-sky-400 mt-1">-80%</p>
                  <p className="text-[9px] text-[var(--text-secondary)]">vs Natural Rapaport</p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-center">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase">Color Standard</p>
                  <p className="text-base font-bold text-[var(--text-main)] mt-1">D to K</p>
                  <p className="text-[9px] text-[var(--text-secondary)]">GIA Certified Scale</p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-center">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase">Clarity Standard</p>
                  <p className="text-base font-bold text-[var(--text-main)] mt-1">FL to I1</p>
                  <p className="text-[9px] text-[var(--text-secondary)]">Flawless to Included</p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-center">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase">Certification</p>
                  <p className="text-base font-bold text-amber-500 mt-1">GIA / IGI / SGL</p>
                  <p className="text-[9px] text-[var(--text-secondary)]">Gemological Labs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Audit Trail & Rate Verification */}
        <div className="space-y-6">
          {/* Current Live Rates Summary Card */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-sm space-y-4">
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <Database className="h-4 w-4 text-amber-500" />
              <span>Active Feed Snapshot</span>
            </h4>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <div>
                  <p className="text-xs font-bold text-[var(--text-main)]">Gold 24K (999)</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Spot + Shop spread</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-500">
                    ₹{((detailedRates?.gold?.k24?.ratePerGram || 0) + settings.goldAdjustmentPerGram).toLocaleString('en-IN')}/g
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    ₹{(((detailedRates?.gold?.k24?.ratePerGram || 0) + settings.goldAdjustmentPerGram) * 10).toLocaleString('en-IN')}/10g
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <div>
                  <p className="text-xs font-bold text-[var(--text-main)]">Gold 22K (916)</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Standard Jewellery Grade</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    ₹{((detailedRates?.gold?.k22?.ratePerGram || 0) + Math.round(settings.goldAdjustmentPerGram * 0.916)).toLocaleString('en-IN')}/g
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <div>
                  <p className="text-xs font-bold text-[var(--text-main)]">Silver 999</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Spot + Shop spread</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    ₹{((detailedRates?.silver?.ratePerGram || 0) + settings.silverAdjustmentPerGram).toLocaleString('en-IN')}/g
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    ₹{(((detailedRates?.silver?.ratePerGram || 0) + settings.silverAdjustmentPerGram) * 1000).toLocaleString('en-IN')}/kg
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <div>
                  <p className="text-xs font-bold text-[var(--text-main)]">Platinum 950</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Spot + Shop spread</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-teal-700 dark:text-teal-400">
                    ₹{((detailedRates?.platinum?.ratePerGram || 0) + settings.platinumAdjustmentPerGram).toLocaleString('en-IN')}/g
                  </p>
                </div>
              </div>
            </div>

            <a
              href="/live-rates"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--gold-primary)] hover:text-stone-900 border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--gold-primary)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>View Public Live Rates Page</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Audit Trail Log */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-sm space-y-4">
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Admin Change Audit Log</span>
            </h4>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {auditLog.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] text-center py-4">No audit logs recorded yet.</p>
              ) : (
                auditLog.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-500 font-mono text-[11px]">{log.action}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-main)]">{log.details}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">By: {log.user}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveRatesAdminSection;
