import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Plus, Edit3, Trash2, Eye, 
  XCircle, Percent, Calendar, 
  BarChart2, MousePointer, Copy, RefreshCw
} from 'lucide-react';
import { campaignService, CampaignData } from '../../services/campaignService';
import { FestiveOfferPopup } from '../FestiveOfferPopup';
import { toast } from '../../utils/toast';

export const CampaignsAdminSection: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<CampaignData> | null>(null);
  const [previewCampaign, setPreviewCampaign] = useState<CampaignData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getAllCampaigns();
      setCampaigns(data);
    } catch (err: any) {
      toast.error('Failed to load promotional campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreateNew = () => {
    const newDraft: Partial<CampaignData> = {
      name: 'Festive Extravaganza Offer',
      badge_label: 'LIMITED FESTIVE OFFER',
      heading: 'FESTIVE EXTRAVAGANZA',
      description: 'Celebrate timeless heritage with Flat 20% OFF on Making Charges on all eligible BIS 916 Gold & Diamond Jewellery.',
      coupon_section_title: 'EXCLUSIVE PROMOTIONAL COUPON',
      coupon_code: 'ROYAL20',
      discount_type: 'percentage',
      discount_value: 20,
      min_order_value: 5000,
      max_discount: 15000,
      eligible_categories: ['All', 'Gold', 'Diamond', 'Bridal', 'Necklaces'],
      eligible_products: [],
      cta_text: 'SHOP ELIGIBLE COLLECTION',
      cta_link: '/#catalog?filter=festive',
      secondary_text: 'LATER',
      trust_message: '100% BIS Hallmarked Purity • RBI Approved Registered Pawn Services',
      start_date: new Date().toISOString().slice(0, 16),
      expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      display_priority: 100,
      status: 'active',
      target_audience: 'first_time_visitors'
    };
    setEditingCampaign(newDraft);
    setIsEditing(true);
  };

  const handleEdit = (c: CampaignData) => {
    setEditingCampaign({
      ...c,
      start_date: c.start_date.slice(0, 16),
      expiry_date: c.expiry_date.slice(0, 16)
    });
    setIsEditing(true);
  };

  const handleToggleStatus = async (c: CampaignData) => {
    const newStatus = c.status === 'active' ? 'draft' : 'active';
    try {
      await campaignService.updateCampaign(c.id, { status: newStatus });
      toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      loadCampaigns();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update campaign status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await campaignService.deleteCampaign(id);
      toast.success('Campaign deleted successfully');
      loadCampaigns();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete campaign');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    if (!editingCampaign.heading?.trim() || !editingCampaign.coupon_code?.trim()) {
      toast.error('Campaign heading and coupon code are required');
      return;
    }

    try {
      const payload: Partial<CampaignData> = {
        ...editingCampaign,
        coupon_code: editingCampaign.coupon_code.trim().toUpperCase(),
        start_date: new Date(editingCampaign.start_date || Date.now()).toISOString(),
        expiry_date: new Date(editingCampaign.expiry_date || Date.now() + 86400000).toISOString(),
        discount_value: Number(editingCampaign.discount_value) || 20,
        min_order_value: Number(editingCampaign.min_order_value) || 5000,
        max_discount: Number(editingCampaign.max_discount) || 15000,
        display_priority: Number(editingCampaign.display_priority) || 10
      };

      if (editingCampaign.id) {
        await campaignService.updateCampaign(editingCampaign.id, payload);
        toast.success('Promotional campaign updated successfully');
      } else {
        await campaignService.createCampaign(payload);
        toast.success('Promotional campaign created successfully');
      }

      setIsEditing(false);
      setEditingCampaign(null);
      loadCampaigns();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save campaign');
    }
  };

  const handleOpenPreview = (c: CampaignData) => {
    setPreviewCampaign(c);
    setIsPreviewOpen(true);
  };

  // Aggregated analytics metrics
  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.analytics?.impressions || 0), 0);
  const totalCopies = campaigns.reduce((acc, c) => acc + (c.analytics?.coupon_copies || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.analytics?.cta_clicks || 0), 0);
  const totalDismissals = campaigns.reduce((acc, c) => acc + (c.analytics?.dismissals || 0), 0);
  const activeCount = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-serif font-bold text-[var(--text-primary)]">
              Festive Offers &amp; Homepage Popup Campaigns
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Configure dynamic first-time visitor popups, coupon privileges, banner content, and real-time patron engagement metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCampaigns}
            className="p-2.5 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            title="Refresh campaigns"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-sans text-[var(--text-muted)] block">Active Campaigns</span>
            <span className="text-lg font-bold font-mono text-[var(--text-primary)]">{activeCount} / {campaigns.length}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-sans text-[var(--text-muted)] block">Total Impressions</span>
            <span className="text-lg font-bold font-mono text-[var(--text-primary)]">{totalImpressions.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-sans text-[var(--text-muted)] block">Coupon Copies</span>
            <span className="text-lg font-bold font-mono text-[var(--text-primary)]">{totalCopies.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <MousePointer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-sans text-[var(--text-muted)] block">CTA Clicks</span>
            <span className="text-lg font-bold font-mono text-[var(--text-primary)]">{totalClicks.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-sans text-[var(--text-muted)] block">CTR ({totalDismissals} dismissed)</span>
            <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
              {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <h3 className="font-semibold text-sm text-[var(--text-primary)]">All Promotional Campaigns</h3>
          <span className="text-xs text-[var(--text-muted)] font-mono">{campaigns.length} total</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
            Loading promotional campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">
            <p>No campaigns found.</p>
            <button
              onClick={handleCreateNew}
              className="mt-3 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-500 text-xs font-semibold cursor-pointer"
            >
              Create your first promotional offer
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {campaigns.map((c) => {
              const isExpired = new Date(c.expiry_date) < new Date();
              const isActive = c.status === 'active' && !isExpired;

              return (
                <div key={c.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[var(--bg-header)] transition-colors">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : isExpired
                          ? 'bg-stone-500/15 text-stone-400 border border-stone-500/30'
                          : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                        {isExpired ? 'Expired' : c.status.toUpperCase()}
                      </span>

                      <span className="px-2 py-0.5 rounded-md bg-[var(--bg-sidebar)] text-[10.5px] text-[var(--text-muted)] font-mono border border-[var(--border-color)]">
                        Priority: {c.display_priority}
                      </span>

                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-[10.5px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
                        {c.coupon_code}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-base text-[var(--text-primary)]">
                      {c.heading}
                    </h4>

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 max-w-2xl">
                      {c.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)] pt-1">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-amber-500" />
                        <span>Discount: {c.discount_type === 'flat' ? `₹${c.discount_value}` : `${c.discount_value}% off making charges`}</span>
                      </span>
                      <span>•</span>
                      <span>Min Order: ₹{c.min_order_value.toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span>Max Cap: ₹{c.max_discount.toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>Valid till: {new Date(c.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </span>
                    </div>
                  </div>

                  {/* Campaign Metrics & Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[var(--border-color)]">
                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-mono">
                      <span title="Impressions" className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>{c.analytics?.impressions || 0}</span>
                      </span>
                      <span title="Copies" className="flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5 text-purple-400" />
                        <span>{c.analytics?.coupon_copies || 0}</span>
                      </span>
                      <span title="Clicks" className="flex items-center gap-1">
                        <MousePointer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{c.analytics?.cta_clicks || 0}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPreview(c)}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-sidebar)] text-xs text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Preview Live Modal"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-500" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          c.status === 'active'
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500'
                        }`}
                      >
                        {c.status === 'active' ? 'Pause' : 'Activate'}
                      </button>

                      <button
                        onClick={() => handleEdit(c)}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-sidebar)] text-[var(--text-secondary)] hover:text-amber-500 transition-colors cursor-pointer"
                        title="Edit Campaign"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(c.id, c.heading)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Campaign Create / Edit Modal Form */}
      <AnimatePresence>
        {isEditing && editingCampaign && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-2xl my-8"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[var(--text-primary)]">
                    {editingCampaign.id ? 'Edit Promotional Campaign' : 'Create New Promotional Offer'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Configure copy, coupon rules, discounts, and targeting settings
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-full hover:bg-[var(--bg-header)] text-[var(--text-secondary)] cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">Campaign Internal Name</label>
                    <input
                      type="text"
                      required
                      value={editingCampaign.name || ''}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                      placeholder="e.g. Festive Extravaganza Offer"
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">Badge Tag Label</label>
                    <input
                      type="text"
                      required
                      value={editingCampaign.badge_label || ''}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, badge_label: e.target.value })}
                      placeholder="e.g. LIMITED FESTIVE OFFER"
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Main Heading</label>
                  <input
                    type="text"
                    required
                    value={editingCampaign.heading || ''}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, heading: e.target.value })}
                    placeholder="e.g. FESTIVE EXTRAVAGANZA"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-primary)] font-serif text-sm font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Offer Description</label>
                  <textarea
                    rows={3}
                    required
                    value={editingCampaign.description || ''}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, description: e.target.value })}
                    placeholder="Celebrate timeless heritage with Flat 20% OFF on Making Charges on all eligible BIS 916 Gold & Diamond Jewellery."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[var(--bg-sidebar)] border border-[var(--border-color)]">
                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">Coupon Code</label>
                    <input
                      type="text"
                      required
                      value={editingCampaign.coupon_code || ''}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, coupon_code: e.target.value.toUpperCase() })}
                      placeholder="ROYAL20"
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold tracking-wider focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">Discount Type</label>
                    <select
                      value={editingCampaign.discount_type || 'percentage'}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, discount_type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                    >
                      <option value="percentage">Percentage (e.g. 20% Making Charges)</option>
                      <option value="flat">Flat Cash Discount (INR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editingCampaign.discount_value ?? 20}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, discount_value: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">Minimum Order Value (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={editingCampaign.min_order_value ?? 5000}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, min_order_value: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">Maximum Discount Cap (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={editingCampaign.max_discount ?? 15000}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, max_discount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">Campaign Start Date</label>
                    <input
                      type="datetime-local"
                      required
                      value={editingCampaign.start_date || ''}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, start_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">Campaign Expiry Date</label>
                    <input
                      type="datetime-local"
                      required
                      value={editingCampaign.expiry_date || ''}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, expiry_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">Primary CTA Button</label>
                    <input
                      type="text"
                      required
                      value={editingCampaign.cta_text || 'SHOP ELIGIBLE COLLECTION'}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, cta_text: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">Display Priority</label>
                    <input
                      type="number"
                      value={editingCampaign.display_priority ?? 100}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, display_priority: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">Status</label>
                    <select
                      value={editingCampaign.status || 'active'}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                    >
                      <option value="active">Active (Published)</option>
                      <option value="draft">Draft (Paused)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-sidebar)] text-[var(--text-secondary)] cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer"
                  >
                    Save Campaign
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Modal Preview */}
      <FestiveOfferPopup
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        campaign={previewCampaign}
      />
    </div>
  );
};

export default CampaignsAdminSection;
