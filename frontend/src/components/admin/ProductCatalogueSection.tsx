import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gem, Plus, Search, Eye, Edit3, Archive, 
  Trash2, RefreshCw, Download, CheckCircle2, AlertTriangle, X, 
  Layers, ExternalLink, Undo2, Box, LayoutGrid, List,
  Upload, Sparkles, Check, ChevronLeft, ChevronRight, Video, Rotate3d
} from 'lucide-react';
import { ApiService } from '../../services/apiService';
import type { JewelryItem, ProductStatus, MetalType } from '../../lib/supabase';
import { toast } from '../../utils/toast';
import { logAuditEvent, AdminRole, hasPermission } from '../../utils/rbac';
import { useRates } from '../../context/RateContext';

interface ProductCatalogueSectionProps {
  activeRole?: AdminRole;
}

export const ProductCatalogueSection: React.FC<ProductCatalogueSectionProps> = ({
  activeRole = 'super_admin'
}) => {
  const { rates } = useRates();
  const goldRate22k = rates?.gold22k || 13684;
  const silverRate = rates?.silver || 220;
  const diamondRatePerCarat = rates?.diamond || 68000;

  // State
  const [products, setProducts] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedMetal, setSelectedMetal] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Multi-selection for bulk operations
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Modal & Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<JewelryItem | null>(null);
  const [previewProduct, setPreviewProduct] = useState<JewelryItem | null>(null);
  const [imageZoomUrl, setImageZoomUrl] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<JewelryItem | null>(null);
  const [bulkActionConfirm, setBulkActionConfirm] = useState<{ action: string; label: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<JewelryItem>>({
    name: '',
    sku: '',
    description: '',
    short_description: '',
    category: 'Necklaces',
    subcategory: '',
    collection: 'Royal Heritage',
    brand: 'YAZHINI FINE JEWELS',
    gender: 'women',
    metal_type: 'gold',
    purity: '22K (916) Hallmark',
    weight: 12.5,
    gross_weight: 12.5,
    net_weight: 12.5,
    stone_weight: 0,
    price: 95000,
    original_price: 105000,
    discount_percent: 0,
    wastage_percent: 10,
    making_charges: 3500,
    stone_charges: 0,
    gst_percent: 3,
    stock_quantity: 5,
    low_stock_threshold: 2,
    in_stock: true,
    status: 'published',
    image_url: '/images/hero_necklace.jpg',
    secondary_image_url: '',
    gallery_images: [],
    variants: [],
    dimensions: '',
    care_instructions: 'Clean with warm water and soft lint-free cloth. Store in separate velvet pouch.',
    tags: ['luxury', 'hallmark', 'handcrafted'],
    is_featured: false,
    is_bestseller: false,
    is_new: true,
    seo_title: '',
    meta_description: '',
    slug: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Metrics summary
  const [metrics, setMetrics] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    outOfStock: 0,
    lowStock: 0
  });

  // Load Inventory Data
  const loadCatalogue = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getAdminInventory({
        search: searchQuery,
        category: selectedCategory,
        gender: selectedGender,
        metal_type: selectedMetal,
        status: selectedStatus,
        stock_status: selectedStockStatus,
        sort: sortBy
      });
      setProducts(res.items);
      setMetrics(res.metrics);
    } catch (err: any) {
      console.error('Failed to load catalogue:', err);
      toast.error('Unable to fetch product catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogue();
  }, [searchQuery, selectedCategory, selectedGender, selectedMetal, selectedStatus, selectedStockStatus, sortBy]);

  // Handle multi-select toggle
  const toggleSelectAll = () => {
    if (selectedProductIds.size === products.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(products.map(p => p.id)));
    }
  };

  const toggleSelectProduct = (id: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedProductIds(next);
  };

  // Open Form for Adding New Product
  const handleOpenAddForm = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `YAZ-NEC-${randomNum}`,
      description: '',
      short_description: '',
      category: 'Necklaces',
      subcategory: 'Bridal',
      collection: 'Royal Heritage',
      brand: 'YAZHINI FINE JEWELS',
      gender: 'women',
      metal_type: 'gold',
      purity: '22K (916) Hallmark',
      weight: 15.0,
      gross_weight: 15.0,
      net_weight: 15.0,
      stone_weight: 0,
      price: 115000,
      original_price: 125000,
      discount_percent: 5,
      wastage_percent: 10,
      making_charges: 4500,
      stone_charges: 0,
      gst_percent: 3,
      stock_quantity: 4,
      low_stock_threshold: 2,
      in_stock: true,
      status: 'published',
      image_url: '/images/hero_necklace.jpg',
      secondary_image_url: '',
      gallery_images: ['/images/hero_necklace.jpg'],
      variants: [
        { id: 'v1', size: '16 Inch', sku: `YAZ-NEC-${randomNum}-16`, stock: 2, price_offset: 0 },
        { id: 'v2', size: '18 Inch', sku: `YAZ-NEC-${randomNum}-18`, stock: 2, price_offset: 5000 }
      ],
      dimensions: 'Length: 16-18 inches, Width: 12mm',
      care_instructions: 'Keep away from perfumes and harsh chemicals. Store in airtight velvet box.',
      tags: ['22k', 'gold', 'bridal', 'hallmark'],
      is_featured: true,
      is_bestseller: false,
      is_new: true,
      seo_title: '',
      meta_description: '',
      slug: ''
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Product
  const handleOpenEditForm = (item: JewelryItem) => {
    setEditingProduct(item);
    setFormData({
      ...item,
      short_description: item.short_description || item.description?.slice(0, 100) || '',
      gross_weight: item.gross_weight || item.weight || 0,
      net_weight: item.net_weight || item.weight || 0,
      stone_weight: item.stone_weight || 0,
      gallery_images: item.gallery_images && item.gallery_images.length > 0 ? item.gallery_images : [item.image_url || '/images/hero_necklace.jpg'],
      variants: item.variants || [],
      low_stock_threshold: item.low_stock_threshold || 2,
      status: item.status || 'published',
      tags: item.tags || []
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Curated Royal Brand Jewellery Assets
  const CURATED_ASSETS = [
    { name: 'Nagas Temple Haram', url: '/images/necklace_temple_nagas_haram.jpg' },
    { name: 'Manga Malai Gold', url: '/images/necklace_manga_malai_temple.jpg' },
    { name: 'Jadau Ruby Bangles', url: '/images/bangle_jadau_ruby_emerald_antique.jpg' },
    { name: 'Rose Gold Designer Kada', url: '/images/bangle_rose_gold_designer_kada.jpg' },
    { name: 'Peacock Gold Jhumkas', url: '/images/earring_peacock_jhumkas.jpg' },
    { name: 'Solitaire Diamond Ring', url: '/images/ring_solitaire_diamond.jpg' },
    { name: 'Burmese Ruby Ring', url: '/images/ring_burmese_ruby_gold.jpg' },
    { name: 'Men’s Cuban Chain', url: '/images/mens_gold_cuban_chain.jpg' },
    { name: 'Men’s Lion Signet Ring', url: '/images/mens_lion_signet_ring.jpg' },
    { name: 'Bridal Sita Kalyanam', url: '/images/bridal_sita_kalyanam.jpg' },
    { name: 'Gold Coin 1g 24K', url: '/images/gold_coin_1g.jpg' },
    { name: 'Silver Pooja Coin 50g', url: '/images/silver_pooja_coin_50g.jpg' },
  ];

  // Auto-generate Unique SKU
  const handleAutoGenerateSku = () => {
    const cat = (formData.category || 'JEW').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newSku = `YAZ-${cat || 'JEW'}-${rand}`;
    setFormData((prev) => ({ ...prev, sku: newSku }));
    if (formErrors.sku) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.sku;
        return next;
      });
    }
    toast.success(`Generated SKU: ${newSku}`);
  };

  // Handle Image File Upload (FileReader to Data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`File "${file.name}" is not a supported image format.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Image "${file.name}" exceeds 10MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setFormData((prev) => {
            const currentGallery = prev.gallery_images || [];
            const isFirst = !prev.image_url || prev.image_url === '/images/hero_necklace.jpg';
            return {
              ...prev,
              image_url: isFirst ? dataUrl : prev.image_url,
              gallery_images: [...currentGallery, dataUrl]
            };
          });
          if (formErrors.image_url) {
            setFormErrors((prev) => {
              const next = { ...prev };
              delete next.image_url;
              return next;
            });
          }
          toast.success(`Uploaded "${file.name}" successfully`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove gallery image
  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setFormData((prev) => {
      const updated = (prev.gallery_images || []).filter((_, idx) => idx !== indexToRemove);
      let newPrimary = prev.image_url;
      if (prev.gallery_images && prev.image_url === prev.gallery_images[indexToRemove]) {
        newPrimary = updated[0] || '';
      }
      return { ...prev, gallery_images: updated, image_url: newPrimary };
    });
  };

  // Set image as primary
  const handleSetPrimaryImage = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, image_url: imageUrl }));
    toast.info('Primary product display image updated');
  };

  // Reorder gallery images (Move Left / Move Right)
  const handleMoveGalleryImage = (index: number, direction: 'left' | 'right') => {
    setFormData((prev) => {
      const current = [...(prev.gallery_images || [])];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return prev;
      const temp = current[index];
      current[index] = current[targetIndex];
      current[targetIndex] = temp;
      return { ...prev, gallery_images: current };
    });
    toast.info(`Moved image ${direction}`);
  };

  // Validate form before save
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'Product title is required';
    if (!formData.sku?.trim()) errors.sku = 'SKU identifier is required';
    if (!formData.category?.trim()) errors.category = 'Category selection is required';
    if (!formData.price || formData.price <= 0) errors.price = 'Valid price in INR is required';
    if (!formData.weight || formData.weight <= 0) errors.weight = 'Metal weight must be greater than 0';
    if (!formData.image_url?.trim()) errors.image_url = 'Primary product image is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Save (Create or Update)
  const handleSaveProduct = async (targetStatus?: ProductStatus) => {
    if (!validateForm()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      setIsSaving(true);
      const now = new Date().toISOString();
      const statusToApply = targetStatus || formData.status || 'published';

      const payload: any = {
        ...formData,
        status: statusToApply,
        in_stock: formData.stock_quantity! > 0 && statusToApply !== 'archived',
        slug: formData.slug || formData.name!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        updated_at: now
      };

      if (editingProduct) {
        // Update existing
        await ApiService.updateJewelryItem(editingProduct.id, payload);
        logAuditEvent({
          action: 'PRODUCT_UPDATED',
          resource: 'inventory',
          details: `Updated product "${payload.name}" (${payload.sku})`,
          severity: 'info'
        });
        toast.success(`Product "${payload.name}" updated successfully`);
      } else {
        // Create new
        payload.id = `prod_${Date.now()}`;
        payload.created_at = now;
        await ApiService.createJewelryItem(payload);
        logAuditEvent({
          action: 'PRODUCT_CREATED',
          resource: 'inventory',
          details: `Created new product "${payload.name}" (${payload.sku}) in ${payload.category}`,
          severity: 'info'
        });
        toast.success(`Product "${payload.name}" created successfully`);
      }

      setIsFormOpen(false);
      setEditingProduct(null);
      await loadCatalogue();
    } catch (err: any) {
      console.error('Error saving product:', err);
      toast.error(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Status Toggle (Publish / Unpublish / Archive / Restore)
  const handleToggleStatus = async (item: JewelryItem, targetStatus: ProductStatus) => {
    try {
      await ApiService.updateProductStatus(item.id, targetStatus);
      logAuditEvent({
        action: `PRODUCT_STATUS_${targetStatus.toUpperCase()}`,
        resource: 'inventory',
        details: `Changed status of "${item.name}" to ${targetStatus}`,
        severity: targetStatus === 'archived' ? 'warning' : 'info'
      });
      toast.success(`Product "${item.name}" marked as ${targetStatus}`);
      await loadCatalogue();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // Handle Safe Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      await ApiService.deleteJewelryItem(deleteConfirmation.id);
      logAuditEvent({
        action: 'PRODUCT_DELETED',
        resource: 'inventory',
        details: `Deleted product "${deleteConfirmation.name}" (${deleteConfirmation.sku})`,
        severity: 'warning'
      });
      toast.success(`Product "${deleteConfirmation.name}" deleted from catalogue`);
      setDeleteConfirmation(null);
      await loadCatalogue();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  // Bulk Actions
  const handleExecuteBulkAction = async () => {
    if (!bulkActionConfirm || selectedProductIds.size === 0) return;

    try {
      const ids = Array.from(selectedProductIds);
      const action = bulkActionConfirm.action as any;
      await ApiService.bulkUpdateProducts(action, ids);
      logAuditEvent({
        action: `BULK_${action.toUpperCase()}`,
        resource: 'inventory',
        details: `Bulk executed ${action} on ${ids.length} products`,
        severity: 'info'
      });
      toast.success(`Successfully applied ${bulkActionConfirm.label} to ${ids.length} products`);
      setSelectedProductIds(new Set());
      setBulkActionConfirm(null);
      await loadCatalogue();
    } catch (err: any) {
      toast.error(err.message || 'Bulk operation failed');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const itemsToExport = selectedProductIds.size > 0 
      ? products.filter(p => selectedProductIds.has(p.id))
      : products;

    if (itemsToExport.length === 0) {
      toast.info('No products available to export');
      return;
    }

    const headers = ['ID', 'SKU', 'Name', 'Category', 'Gender', 'Metal', 'Purity', 'Weight(g)', 'Price(INR)', 'Stock', 'Status'];
    const rows = itemsToExport.map(p => [
      `"${p.id}"`,
      `"${p.sku || ''}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.gender || 'women'}"`,
      `"${p.metal_type}"`,
      `"${p.purity || ''}"`,
      p.weight || 0,
      p.price || 0,
      p.stock_quantity ?? (p.in_stock ? 1 : 0),
      `"${p.status || 'published'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `YAZHINI_Jewellery_Catalogue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${itemsToExport.length} products to CSV`);
  };

  // Computed Live Estimated Price based on Gold Rate
  const calculatedEstimatedPrice = useMemo(() => {
    const weight = Number(formData.weight) || 0;
    const wastagePercent = Number(formData.wastage_percent) || 0;
    const making = Number(formData.making_charges) || 0;
    const stone = Number(formData.stone_charges) || 0;
    const gstRate = 0.03;

    let baseMetalCost = 0;
    if (formData.metal_type === 'gold') {
      const purityMultiplier = formData.purity?.includes('24K') ? 1.0 : (formData.purity?.includes('18K') ? 0.75 : 0.916);
      baseMetalCost = weight * goldRate22k * (purityMultiplier / 0.916);
    } else if (formData.metal_type === 'silver') {
      baseMetalCost = weight * silverRate;
    } else if (formData.metal_type === 'diamond') {
      baseMetalCost = weight * goldRate22k * 0.75 + (formData.diamond_carat || 0.5) * diamondRatePerCarat;
    } else {
      baseMetalCost = weight * 4500;
    }

    const wastageCost = baseMetalCost * (wastagePercent / 100);
    const subtotal = baseMetalCost + wastageCost + making + stone;
    const tax = subtotal * gstRate;
    return Math.round(subtotal + tax);
  }, [formData.weight, formData.metal_type, formData.purity, formData.wastage_percent, formData.making_charges, formData.stone_charges, formData.diamond_carat, goldRate22k, silverRate, diamondRatePerCarat]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Metrics Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] border border-[var(--gold-primary)]/20">
              <Gem className="w-5 h-5 text-[var(--gold-primary)]" />
            </span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-main)] font-inter">
                Products & Catalogue Management
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Curate luxury jewellery collections, oversee live gold pricing, manage variants, and publish updates to the customer store.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadCatalogue}
            className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors"
            title="Refresh catalogue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-main)] hover:border-[var(--gold-primary)] transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            <span>Export CSV</span>
          </button>

          {hasPermission(activeRole, 'inventory', 'create') && (
            <button
              onClick={handleOpenAddForm}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-semibold text-xs shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-main)]">Total Items</span>
            <Layers className="w-4 h-4 text-[var(--gold-primary)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-main)] mt-1.5">{metrics.total}</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">In master catalogue</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-main)]">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-main)] mt-1.5">{metrics.published}</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">Live on customer store</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-main)]">Drafts</span>
            <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-main)] mt-1.5">{metrics.draft}</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">Private staging</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-main)]">Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-main)] mt-1.5">{metrics.outOfStock}</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">0 items remaining</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-main)]">Low Stock</span>
            <Box className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-main)] mt-1.5">{metrics.lowStock}</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">Threshold ≤ 2 pcs</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-main)]">Archived</span>
            <Archive className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-main)] mt-1.5">{metrics.archived}</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">Preserved history</div>
        </div>
      </div>

      {/* 2. Filters & Toolbar */}
      <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, SKU, or category..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
            >
              <option value="All">All Categories</option>
              <option value="Necklaces">Necklaces</option>
              <option value="Earrings">Earrings</option>
              <option value="Rings">Rings</option>
              <option value="Bangles">Bangles & Bracelets</option>
              <option value="Mangalsutras">Mangalsutras</option>
              <option value="Chains">Chains</option>
              <option value="Pendants">Pendants</option>
              <option value="Bridal Sets">Bridal Sets</option>
              <option value="Anklets">Anklets & Payal</option>
              <option value="Gold coins">Gold & Silver Coins</option>
            </select>

            {/* Gender Select */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
            >
              <option value="All">All Genders</option>
              <option value="women">Women's Collection</option>
              <option value="men">Men's Collection</option>
              <option value="unisex">Unisex Collection</option>
            </select>

            {/* Metal Select */}
            <select
              value={selectedMetal}
              onChange={(e) => setSelectedMetal(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
            >
              <option value="All">All Metals</option>
              <option value="gold">Gold (22K / 18K)</option>
              <option value="diamond">Certified Diamond</option>
              <option value="platinum">Platinum (Pt950)</option>
              <option value="silver">Silver (925 / 999)</option>
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            {/* Stock Status Select */}
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
            >
              <option value="all">All Inventory</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock (≤ 2)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="name_asc">Name: A to Z</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-[var(--gold-primary)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-[var(--gold-primary)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Strip when items selected */}
        {selectedProductIds.size > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/30 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[var(--text-main)]">
                {selectedProductIds.size} of {products.length} products selected
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setBulkActionConfirm({ action: 'publish', label: 'Publish to Store' })}
                className="px-2.5 py-1 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
              >
                Publish Selected
              </button>
              <button
                onClick={() => setBulkActionConfirm({ action: 'unpublish', label: 'Move to Drafts' })}
                className="px-2.5 py-1 rounded bg-amber-600 text-white font-medium hover:bg-amber-500 transition-colors"
              >
                Unpublish
              </button>
              <button
                onClick={() => setBulkActionConfirm({ action: 'archive', label: 'Archive Products' })}
                className="px-2.5 py-1 rounded bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
              >
                Archive
              </button>
              <button
                onClick={() => setSelectedProductIds(new Set())}
                className="px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Products Table or Grid View */}
      {viewMode === 'table' ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-header)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedProductIds.size === products.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[var(--border-color)] text-[var(--gold-primary)] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3 w-16">Item</th>
                <th className="p-3 min-w-[200px]">Product Title & SKU</th>
                <th className="p-3">Category & Gender</th>
                <th className="p-3">Metal & Purity</th>
                <th className="p-3">Weight</th>
                <th className="p-3 whitespace-nowrap">Selling Price</th>
                <th className="p-3 whitespace-nowrap">Stock Count</th>
                <th className="p-3 whitespace-nowrap">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-secondary)]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-[var(--text-muted)]">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[var(--gold-primary)]" />
                      <span>Loading verified catalogue inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-[var(--text-muted)]">
                    <Gem className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold text-[var(--text-main)]">No jewellery products found</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Try clearing your search query or adjusting your category/metal filters.</p>
                  </td>
                </tr>
              ) : (
                products.map((item) => {
                  const isSelected = selectedProductIds.has(item.id);
                  const isLowStock = (item.stock_quantity ?? (item.in_stock ? 1 : 0)) <= (item.low_stock_threshold ?? 2) && (item.stock_quantity ?? (item.in_stock ? 1 : 0)) > 0;
                  const isOutOfStock = !item.in_stock || (item.stock_quantity ?? 0) === 0;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-[var(--bg-elevated)]/60 transition-colors ${isSelected ? 'bg-[var(--gold-primary)]/5' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(item.id)}
                          className="rounded border-[var(--border-color)] text-[var(--gold-primary)] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Thumbnail */}
                      <td className="p-3">
                        <div 
                          onClick={() => setImageZoomUrl(item.image_url)}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-[var(--border-color)] bg-white cursor-pointer group relative shrink-0 shadow-sm"
                        >
                          <img
                            src={item.image_url || '/images/hero_necklace.jpg'}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </td>

                      {/* Title & SKU */}
                      <td className="p-3">
                        <div className="font-semibold text-[var(--text-main)] hover:text-[var(--gold-primary)] transition-colors cursor-pointer" onClick={() => setPreviewProduct(item)}>
                          {item.name}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="font-mono text-[10px] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-muted)]">
                            {item.sku || item.id}
                          </span>
                          {item.is_featured && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category & Gender */}
                      <td className="p-3">
                        <div className="font-medium text-[var(--text-main)]">{item.category}</div>
                        <div className="capitalize text-[10px] text-[var(--text-muted)] mt-0.5">
                          {item.gender || 'Women'}
                        </div>
                      </td>

                      {/* Metal & Purity */}
                      <td className="p-3">
                        <div className="capitalize font-medium text-[var(--text-main)]">
                          {item.metal_type}
                        </div>
                        <div className="text-[10px] text-[var(--gold-primary)] font-medium">
                          {item.purity || '22K (916)'}
                        </div>
                      </td>

                      {/* Weight */}
                      <td className="p-3">
                        <div className="font-medium text-[var(--text-main)] font-mono">
                          {item.weight.toFixed(2)} g
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          Wastage: {item.wastage_percent}%
                        </div>
                      </td>

                      {/* Price in INR */}
                      <td className="p-3">
                        <div className="font-semibold text-[var(--text-main)] font-mono text-sm">
                          ₹{item.price.toLocaleString('en-IN')}
                        </div>
                        {item.original_price && item.original_price > item.price && (
                          <div className="text-[10px] text-[var(--text-muted)] line-through">
                            ₹{item.original_price.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="p-3 whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 whitespace-nowrap">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 whitespace-nowrap">
                            Low: {item.stock_quantity} left
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 whitespace-nowrap">
                            In Stock: {item.stock_quantity ?? 1}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3 whitespace-nowrap">
                        {(item.status || 'published') === 'published' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                            <span>Published</span>
                          </span>
                        ) : item.status === 'draft' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                            <span>Draft</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200 dark:bg-stone-800/60 dark:text-stone-300 dark:border-stone-700 whitespace-nowrap">
                            <Archive className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                            <span>Archived</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Preview Action */}
                          <button
                            onClick={() => setPreviewProduct(item)}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                            title="Product Details & Customer Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Action */}
                          {hasPermission(activeRole, 'inventory', 'update') && (
                            <button
                              onClick={() => handleOpenEditForm(item)}
                              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-amber-400 hover:bg-[var(--bg-elevated)] transition-colors"
                              title="Edit Product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Publish / Unpublish Toggle */}
                          {hasPermission(activeRole, 'inventory', 'update') && (
                            item.status === 'draft' ? (
                              <button
                                onClick={() => handleToggleStatus(item, 'published')}
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                title="Publish Product"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            ) : item.status === 'archived' ? (
                              <button
                                onClick={() => handleToggleStatus(item, 'published')}
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                title="Restore Product"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(item, 'archived')}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-500/10 transition-colors"
                                title="Archive Product"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}

                          {/* Delete Action */}
                          {hasPermission(activeRole, 'inventory', 'delete') && (
                            <button
                              onClick={() => setDeleteConfirmation(item)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm hover:border-[var(--gold-primary)]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div 
                  onClick={() => setImageZoomUrl(item.image_url)}
                  className="w-full aspect-square rounded-lg overflow-hidden border border-[var(--border-color)] bg-white cursor-pointer group relative mb-3"
                >
                  <img
                    src={item.image_url || '/images/hero_necklace.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 text-white backdrop-blur-sm">
                    {item.sku}
                  </span>
                </div>

                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{item.category} • {item.gender}</div>
                <div className="font-semibold text-sm text-[var(--text-main)] mt-1 line-clamp-1">{item.name}</div>
                <div className="text-base font-bold text-[var(--gold-primary)] font-mono mt-1">₹{item.price.toLocaleString('en-IN')}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{item.purity || '22K'} • {item.weight}g</div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                <button
                  onClick={() => setPreviewProduct(item)}
                  className="px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-main)] hover:border-[var(--gold-primary)]"
                >
                  Preview
                </button>
                <button
                  onClick={() => handleOpenEditForm(item)}
                  className="px-2.5 py-1 rounded bg-[var(--gold-primary)] text-black font-semibold text-xs hover:bg-amber-400"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Add / Edit Product Modal Drawer */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="p-2 rounded-lg bg-[var(--gold-primary)]/10 text-[var(--gold-primary)]">
                    <Gem className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-[var(--text-main)] font-inter">
                      {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Jewellery Product'}
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Fill out specifications, pricing formula, inventory variants, and media assets.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - Scrollable Form */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                {/* Validation Errors Review Alert Banner */}
                {Object.keys(formErrors).length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Please correct the following fields before saving:</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-rose-400">
                        {Object.entries(formErrors).map(([key, msg]) => (
                          <li key={key}><strong className="capitalize">{key}:</strong> {msg}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Section A: Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-[var(--text-main)] flex items-center space-x-1.5 border-b border-[var(--border-color)] pb-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)]" />
                    <span>A. Basic Product Information</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                        Product Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Royal Sovereign 22K Gold Temple Necklace"
                        className={`w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border ${formErrors.name ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]`}
                      />
                      {formErrors.name && <p className="text-rose-400 text-[10px] mt-1">{formErrors.name}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-medium text-[var(--text-secondary)]">
                          Product SKU / Identifier <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAutoGenerateSku}
                          className="text-[10px] text-[var(--gold-primary)] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" /> Auto-Generate
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.sku || ''}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                        placeholder="e.g. YAZ-NEC-001"
                        className={`w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border ${formErrors.sku ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--gold-primary)]`}
                      />
                      {formErrors.sku && <p className="text-rose-400 text-[10px] mt-1">{formErrors.sku}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                        Department Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.category || 'Necklaces'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                      >
                        <option value="Necklaces">Necklaces</option>
                        <option value="Earrings">Earrings</option>
                        <option value="Rings">Rings</option>
                        <option value="Bangles">Bangles & Bracelets</option>
                        <option value="Mangalsutras">Mangalsutras</option>
                        <option value="Chains">Chains</option>
                        <option value="Pendants">Pendants</option>
                        <option value="Bridal Sets">Bridal Sets</option>
                        <option value="Anklets">Anklets & Payal</option>
                        <option value="Gold coins">Gold & Silver Coins</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                        Gender Classification <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.gender || 'women'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                      >
                        <option value="women">Women's Jewellery</option>
                        <option value="men">Men's Jewellery</option>
                        <option value="unisex">Unisex Jewellery</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                        Collection Name
                      </label>
                      <input
                        type="text"
                        value={formData.collection || ''}
                        onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                        placeholder="e.g. Royal Heritage, Vivaah Bridal, Solitaire"
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                        Publication Status
                      </label>
                      <select
                        value={formData.status || 'published'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                      >
                        <option value="published">Published (Visible to Customers)</option>
                        <option value="draft">Draft (Private in Admin)</option>
                        <option value="archived">Archived (Hidden)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                      Short Description (Teaser for Cards)
                    </label>
                    <input
                      type="text"
                      value={formData.short_description || ''}
                      onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                      placeholder="Brief one-line summary of craftsmanship and stones..."
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                      Full Product Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Comprehensive details on design inspiration, hallmarking, dimensions, and styling..."
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                    />
                  </div>
                </div>

                {/* Section B: Jewellery Specifications */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-[var(--text-main)] flex items-center space-x-1.5 border-b border-[var(--border-color)] pb-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)]" />
                    <span>B. Jewellery Specifications & Hallmarking</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Metal Type</label>
                      <select
                        value={formData.metal_type || 'gold'}
                        onChange={(e) => setFormData({ ...formData, metal_type: e.target.value as MetalType })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                      >
                        <option value="gold">Gold</option>
                        <option value="diamond">Diamond</option>
                        <option value="platinum">Platinum</option>
                        <option value="silver">Silver</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Purity Hallmark</label>
                      <input
                        type="text"
                        value={formData.purity || ''}
                        onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                        placeholder="e.g. 22K (916) Hallmark"
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                        Gross Weight (g) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.weight || 0}
                        onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0, gross_weight: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--gold-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Wastage / VA %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.wastage_percent || 0}
                        onChange={(e) => setFormData({ ...formData, wastage_percent: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--gold-primary)]"
                      />
                    </div>
                  </div>

                  {formData.metal_type === 'diamond' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Diamond Carat (ct)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.diamond_carat || 0.5}
                          onChange={(e) => setFormData({ ...formData, diamond_carat: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Colour Grade</label>
                        <input
                          type="text"
                          value={formData.diamond_colour || 'E-F'}
                          onChange={(e) => setFormData({ ...formData, diamond_colour: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Clarity Grade</label>
                        <input
                          type="text"
                          value={formData.diamond_clarity || 'VVS-VS'}
                          onChange={(e) => setFormData({ ...formData, diamond_clarity: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Certification</label>
                        <input
                          type="text"
                          value={formData.certification || 'IGI / SGL Certified'}
                          onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Stone Details (if any)</label>
                      <input
                        type="text"
                        value={formData.stone_details || ''}
                        onChange={(e) => setFormData({ ...formData, stone_details: e.target.value })}
                        placeholder="e.g. Natural Burmese Rubies, Kemp Gemstones"
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Dimensions / Sizing</label>
                      <input
                        type="text"
                        value={formData.dimensions || ''}
                        onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                        placeholder="e.g. 18 Inch Length, Ring Size 14, 2.6 Bangle"
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Pricing & Tax Preview */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-[var(--text-main)] flex items-center space-x-1.5 border-b border-[var(--border-color)] pb-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)]" />
                    <span>C. Pricing, Making Charges & Tax</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                        Final Retail Selling Price (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.price || 0}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] font-mono font-bold text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Original Price (₹)</label>
                      <input
                        type="number"
                        value={formData.original_price || 0}
                        onChange={(e) => setFormData({ ...formData, original_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Making Charges (₹)</label>
                      <input
                        type="number"
                        value={formData.making_charges || 0}
                        onChange={(e) => setFormData({ ...formData, making_charges: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] font-mono"
                      />
                    </div>
                  </div>

                  {/* Pricing Breakdown Box */}
                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[11px] text-[var(--text-muted)]">Live Formula Reference Price</div>
                      <div className="text-sm font-bold text-[var(--gold-primary)] font-mono mt-0.5">
                        ₹{calculatedEstimatedPrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        (Gold 22K @ ₹{goldRate22k.toLocaleString('en-IN')}/g + {formData.wastage_percent}% VA + ₹{formData.making_charges || 0} Making + 3% GST)
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, price: calculatedEstimatedPrice })}
                      className="px-3 py-1.5 rounded-lg border border-[var(--gold-primary)]/40 bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/20 transition-all font-medium text-[11px]"
                    >
                      Apply Formula Price
                    </button>
                  </div>
                </div>

                {/* Section D: Inventory & Multi-Variants */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-[var(--text-main)] flex items-center space-x-1.5 border-b border-[var(--border-color)] pb-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)]" />
                    <span>D. Inventory & Available Variants</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Initial Stock Quantity</label>
                      <input
                        type="number"
                        value={formData.stock_quantity ?? 1}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Low-Stock Alert Threshold</label>
                      <input
                        type="number"
                        value={formData.low_stock_threshold ?? 2}
                        onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 2 })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section E: Product Images */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-[var(--text-main)] flex items-center space-x-1.5 border-b border-[var(--border-color)] pb-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)]" />
                    <span>E. Product Photography & Gallery</span>
                  </h4>

                  {/* Drag-and-drop / Local Upload Area */}
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">
                      Upload Photos from Device (Multi-Image Support)
                    </label>
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--border-color)] hover:border-[var(--gold-primary)] rounded-xl cursor-pointer bg-[var(--bg-elevated)]/40 hover:bg-[var(--gold-primary)]/5 transition-all text-center group">
                      <div className="p-3 rounded-full bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] group-hover:scale-110 transition-transform mb-2">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-main)]">Click to upload or drag images here</span>
                      <span className="text-[10px] text-[var(--text-muted)] mt-1">PNG, JPG, WEBP up to 10MB each • Automatically attaches to product gallery</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Curated Brand Assets Quick-Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                        <span>Curated Royal Fine Jewels Assets</span>
                      </label>
                      <span className="text-[10px] text-[var(--text-muted)]">Click any asset to append to gallery</span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {CURATED_ASSETS.map((asset) => {
                        const isSelected = formData.image_url === asset.url || (formData.gallery_images && formData.gallery_images.includes(asset.url));
                        return (
                          <button
                            key={asset.url}
                            type="button"
                            onClick={() => {
                              const currentGallery = formData.gallery_images || [];
                              const alreadyInGallery = currentGallery.includes(asset.url);
                              const updatedGallery = alreadyInGallery ? currentGallery : [...currentGallery, asset.url];
                              const newPrimary = formData.image_url && formData.image_url !== '/images/hero_necklace.jpg'
                                ? formData.image_url
                                : asset.url;
                              setFormData({
                                ...formData,
                                image_url: newPrimary,
                                gallery_images: updatedGallery,
                              });
                              if (formErrors.image_url) {
                                setFormErrors((prev) => {
                                  const next = { ...prev };
                                  delete next.image_url;
                                  return next;
                                });
                              }
                              toast.success(`Added ${asset.name} to product gallery`);
                            }}
                            className={`group relative rounded-lg overflow-hidden border transition-all text-left aspect-square ${
                              isSelected
                                ? 'border-[var(--gold-primary)] ring-2 ring-[var(--gold-primary)]/30'
                                : 'border-[var(--border-color)] hover:border-[var(--gold-primary)]/50'
                            }`}
                            title={asset.name}
                          >
                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                              <span className="text-[9px] text-white/90 font-medium truncate w-full">{asset.name}</span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-[var(--gold-primary)] text-slate-950 p-0.5 rounded-full">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gallery Thumbnails Strip with Reordering */}
                  {formData.gallery_images && formData.gallery_images.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                          Active Gallery Images ({formData.gallery_images.length}) • Rearrange display order
                        </label>
                        <span className="text-[10px] text-[var(--text-muted)]">Use arrows to change sequence</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5 p-3 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-color)]">
                        {formData.gallery_images.map((img, idx) => {
                          const isPrimary = formData.image_url === img;
                          return (
                            <div
                              key={`${img}-${idx}`}
                              className={`relative group rounded-lg overflow-hidden border w-24 h-24 bg-black/10 shrink-0 ${
                                isPrimary ? 'border-[var(--gold-primary)] ring-2 ring-[var(--gold-primary)]' : 'border-[var(--border-color)]'
                              }`}
                            >
                              <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                              {isPrimary && (
                                <span className="absolute top-1 left-1 bg-[var(--gold-primary)] text-slate-950 font-bold text-[8px] px-1 py-0.5 rounded shadow z-10">
                                  PRIMARY
                                </span>
                              )}
                              
                              {/* Sequence order tag */}
                              <span className="absolute bottom-1 right-1 bg-black/70 text-white font-mono text-[8px] px-1 rounded z-10">
                                #{idx + 1}
                              </span>

                              {/* Hover Action Overlay */}
                              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1 z-20">
                                <div className="flex items-center gap-1 w-full">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveGalleryImage(idx, 'left')}
                                    className="flex-1 p-1 bg-white/20 hover:bg-white/30 text-white rounded disabled:opacity-30 flex items-center justify-center cursor-pointer"
                                    title="Move Earlier"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === (formData.gallery_images?.length || 1) - 1}
                                    onClick={() => handleMoveGalleryImage(idx, 'right')}
                                    className="flex-1 p-1 bg-white/20 hover:bg-white/30 text-white rounded disabled:opacity-30 flex items-center justify-center cursor-pointer"
                                    title="Move Later"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {!isPrimary && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryImage(img)}
                                    className="w-full text-[8.5px] py-0.5 bg-[var(--gold-primary)] text-slate-950 rounded font-semibold text-center hover:bg-[var(--gold-light)] cursor-pointer"
                                  >
                                    Set Main
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGalleryImage(idx)}
                                  className="w-full text-[8.5px] py-0.5 bg-rose-600 text-white rounded font-semibold text-center hover:bg-rose-500 cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Manual URL Input & Primary Asset Preview */}
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                      Primary Asset URL (Direct Path or CDN) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.image_url || ''}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="/images/mens_gold_cuban_chain.jpg"
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] font-mono text-xs"
                    />
                    {formErrors.image_url && (
                      <p className="text-[11px] text-rose-500 mt-1">{formErrors.image_url}</p>
                    )}
                  </div>

                  {formData.image_url && (
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-[var(--border-color)] bg-white shrink-0">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[var(--text-main)] text-xs flex items-center space-x-1.5">
                          <span>Primary Display Asset</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                            Ready
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono truncate max-w-sm mt-0.5">
                          {formData.image_url}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product HD Video URL & Live Player Preview */}
                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border-color)] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                        <span>Product HD Video Clip (Optional)</span>
                      </label>
                      <span className="text-[10px] text-[var(--text-muted)]">MP4 / WebM / CDN Video link</span>
                    </div>
                    <input
                      type="text"
                      value={formData.video_url || ''}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="/images/Gold_jewellery_commercial_product_film_20261024110518.mp4"
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] font-mono text-xs"
                    />
                    {formData.video_url && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-[var(--border-color)] bg-black/90 aspect-video max-h-36 flex items-center justify-center">
                        <video
                          src={formData.video_url}
                          controls
                          muted
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Interactive 360° Studio Settings */}
                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border-color)] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                        <Rotate3d className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                        <span>Interactive 360° Studio Viewer</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        Enables 360-degree drag rotation on customer product detail page
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_360 || false}
                        onChange={(e) => setFormData({ ...formData, has_360: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--gold-primary)]"></div>
                    </label>
                  </div>
                </div>

                {/* Section F: SEO & Merchandising */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-[var(--text-main)] flex items-center space-x-1.5 border-b border-[var(--border-color)] pb-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)]" />
                    <span>F. Merchandising & SEO Flags</span>
                  </h4>

                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_featured || false}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="rounded border-[var(--border-color)] text-[var(--gold-primary)] focus:ring-0"
                      />
                      <span className="text-[var(--text-main)]">Featured on Homepage</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_new || false}
                        onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                        className="rounded border-[var(--border-color)] text-[var(--gold-primary)] focus:ring-0"
                      />
                      <span className="text-[var(--text-main)]">New Arrival Badge</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_bestseller || false}
                        onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.checked })}
                        className="rounded border-[var(--border-color)] text-[var(--gold-primary)] focus:ring-0"
                      />
                      <span className="text-[var(--text-main)]">Bestseller Badge</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-header)] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors"
                >
                  Cancel
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveProduct('draft')}
                    className="px-4 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold text-xs hover:bg-amber-500/20 transition-all"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveProduct('published')}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-semibold text-xs shadow-md hover:shadow-lg transition-all"
                  >
                    {isSaving ? 'Saving Product...' : (editingProduct ? 'Save Changes' : 'Publish Product')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Product Preview Drawer */}
      <AnimatePresence>
        {previewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md h-full bg-[var(--bg-card)] border-l border-[var(--border-color)] p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <h3 className="font-bold text-base text-[var(--text-main)] font-inter">Product Overview</h3>
                <button 
                  onClick={() => setPreviewProduct(null)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image Preview */}
              <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-white aspect-square shadow-sm">
                <img
                  src={previewProduct.image_url || '/images/hero_necklace.jpg'}
                  alt={previewProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-muted)]">
                  {previewProduct.sku || previewProduct.id}
                </span>
                <h2 className="text-lg font-bold text-[var(--text-main)] mt-2 font-inter leading-snug">
                  {previewProduct.name}
                </h2>
                <div className="text-xl font-bold text-[var(--gold-primary)] font-mono mt-1">
                  ₹{previewProduct.price.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <div>
                  <span className="text-[var(--text-muted)]">Category:</span>
                  <div className="font-semibold text-[var(--text-main)]">{previewProduct.category}</div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Gender:</span>
                  <div className="font-semibold text-[var(--text-main)] capitalize">{previewProduct.gender || 'Women'}</div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Metal Purity:</span>
                  <div className="font-semibold text-[var(--text-main)]">{previewProduct.purity || '22K'}</div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Net Weight:</span>
                  <div className="font-semibold text-[var(--text-main)] font-mono">{previewProduct.weight} g</div>
                </div>
              </div>

              <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <div className="font-semibold text-[var(--text-main)] mb-1">Description</div>
                <p>{previewProduct.description || 'No description provided.'}</p>
              </div>

              <div className="mt-auto pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                <a
                  href={`/jewellery/product/${previewProduct.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs text-[var(--gold-primary)] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Customer Page</span>
                </a>

                <button
                  onClick={() => {
                    const target = previewProduct;
                    setPreviewProduct(null);
                    handleOpenEditForm(target);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--gold-primary)] text-black font-semibold text-xs"
                >
                  Edit Product
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Image Zoom Modal */}
      <AnimatePresence>
        {imageZoomUrl && (
          <div 
            onClick={() => setImageZoomUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden border border-[var(--border-color)] bg-white shadow-2xl"
            >
              <img src={imageZoomUrl} alt="Zoom" className="w-full h-full object-contain max-h-[80vh]" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-rose-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl text-xs space-y-4"
            >
              <div className="flex items-center space-x-3 text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-bold text-base text-[var(--text-main)]">Confirm Product Deletion</h3>
              </div>

              <p className="text-[var(--text-secondary)] leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-[var(--text-main)]">"{deleteConfirmation.name}"</strong> (SKU: {deleteConfirmation.sku})?
              </p>

              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                <strong>Warning:</strong> Permanent deletion removes the record from master inventory. If this item has historical customer sales or orders, archival is recommended instead.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    const item = deleteConfirmation;
                    setDeleteConfirmation(null);
                    handleToggleStatus(item, 'archived');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-600"
                >
                  Archive Instead
                </button>

                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-500"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Bulk Action Confirmation Dialog */}
      <AnimatePresence>
        {bulkActionConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full shadow-2xl text-xs space-y-4"
            >
              <div className="flex items-center space-x-3 text-[var(--gold-primary)]">
                <Layers className="w-6 h-6 shrink-0" />
                <h3 className="font-bold text-base text-[var(--text-main)]">Confirm Bulk Action</h3>
              </div>

              <p className="text-[var(--text-secondary)] leading-relaxed">
                You are about to execute <strong className="text-[var(--text-main)]">{bulkActionConfirm.label}</strong> on <strong className="text-[var(--text-main)]">{selectedProductIds.size}</strong> selected items.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setBulkActionConfirm(null)}
                  className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={handleExecuteBulkAction}
                  className="px-4 py-2 rounded-lg bg-[var(--gold-primary)] text-black font-semibold hover:bg-amber-400"
                >
                  Proceed with Bulk Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductCatalogueSection;
