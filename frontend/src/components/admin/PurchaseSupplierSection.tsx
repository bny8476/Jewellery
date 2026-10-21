import React, { useState, useEffect } from 'react';
import { Building2, Plus, Truck } from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';
import { toast } from '../../utils/toast';
import { logAuditEvent } from '../../utils/rbac';
import FormFieldError from '../FormFieldError';
import {
  validatePurchaseEntry,
  validateSupplierForm,
  hasErrors,
  firstError
} from '../../utils/adminFormRules';
import { 
  getSuppliers, 
  createSupplier, 
  getPurchases, 
  createPurchase, 
  getNextPurchaseOrderNumber,
  type SupplierRecord,
  type PurchaseInwardRecord
} from '../../services/retailService';

export const PurchaseSupplierSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inward' | 'suppliers' | 'history'>('inward');
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInwardRecord[]>([]);

  // Inward Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [metalType, setMetalType] = useState('Gold');
  const [purity, setPurity] = useState('24K (999)');
  const [grossWeight, setGrossWeight] = useState<number>(100);
  const [netWeight, setNetWeight] = useState<number>(100);
  const [ratePerGram, setRatePerGram] = useState<number>(7850);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [purchaseErrors, setPurchaseErrors] = useState<Record<string, string>>({});

  // New Supplier Modal State
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [newCategory, setNewCategory] = useState<SupplierRecord['category']>('Bullion Refiner');
  const [supplierErrors, setSupplierErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSuppliers();
    loadPurchases();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.warn('Failed to load suppliers:', err);
    }
  };

  const loadPurchases = async () => {
    try {
      const data = await getPurchases();
      setPurchases(data);
    } catch (err) {
      console.warn('Failed to load purchases:', err);
    }
  };

  const computedTotal = Math.round(netWeight * ratePerGram);

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validatePurchaseEntry({
      supplier_id: selectedSupplierId,
      gross_weight: grossWeight,
      net_weight: netWeight,
      rate_per_gram: ratePerGram,
      paid_amount: paidAmount,
      total_amount: computedTotal
    });

    if (hasErrors(errors)) {
      setPurchaseErrors(errors);
      const first = firstError(errors);
      if (first) toast.error(first);
      return;
    }
    setPurchaseErrors({});

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    try {
      const poNumber = await getNextPurchaseOrderNumber();
      const newPO: PurchaseInwardRecord = {
        id: `pur-${Date.now()}`,
        purchase_number: poNumber,
        supplier_id: supplier.id,
        supplier_name: supplier.supplier_name,
        invoice_ref: invoiceRef || `INV-${Date.now()}`,
        metal_type: metalType,
        purity,
        gross_weight: grossWeight,
        net_weight: netWeight,
        rate_per_gram: ratePerGram,
        total_amount: computedTotal,
        paid_amount: paidAmount,
        payment_status: paidAmount >= computedTotal ? 'paid' : (paidAmount > 0 ? 'partial' : 'pending'),
        purchase_date: new Date().toISOString(),
        notes
      };

      await createPurchase(newPO);
      const updatedPurchases = [newPO, ...purchases];
      setPurchases(updatedPurchases);

      // Update supplier outstanding if partial/pending
      const unpaid = Math.max(0, computedTotal - paidAmount);
      if (unpaid > 0) {
        setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, outstanding_balance: s.outstanding_balance + unpaid } : s));
      }

      logAuditEvent(
        'GOODS_INWARD_RECORDED',
        'purchases',
        `Purchased ${netWeight}g ${metalType} (${purity}) from ${supplier.supplier_name} for ₹${computedTotal.toLocaleString('en-IN')}`
      );

      toast.success(`Purchase Inward ${newPO.purchase_number} recorded & persisted`);
      setInvoiceRef('');
      setGrossWeight(100);
      setNetWeight(100);
      setPaidAmount(0);
      setNotes('');
      setPurchaseErrors({});
      setActiveTab('history');
    } catch (err: any) {
      toast.error('Failed to record purchase: ' + err.message);
    }
  };

  const handleCreateSupplier = async () => {
    const existingGstins = suppliers.map(s => s.gstin).filter(Boolean) as string[];
    const errors = validateSupplierForm(
      {
        supplier_name: newSupplierName,
        phone: newPhone,
        gstin: newGstin
      },
      existingGstins
    );

    if (hasErrors(errors)) {
      setSupplierErrors(errors);
      const first = firstError(errors);
      if (first) toast.error(first);
      return;
    }
    setSupplierErrors({});

    try {
      const cleanedGstin = newGstin.trim() ? newGstin.trim().toUpperCase() : 'Unregistered';
      const newSup: SupplierRecord = {
        id: `sup-${Date.now()}`,
        supplier_name: newSupplierName.trim(),
        contact_person: newContactPerson.trim() || 'Managing Partner',
        phone: newPhone.trim(),
        email: `${newSupplierName.toLowerCase().replace(/[^a-z]/g, '')}@supplier.in`,
        gstin: cleanedGstin,
        address: 'Jewellery Bazaar, Coimbatore',
        category: newCategory,
        outstanding_balance: 0,
        created_at: new Date().toISOString()
      };
      await createSupplier(newSup);
      const updated = [newSup, ...suppliers];
      setSuppliers(updated);
      setSelectedSupplierId(newSup.id);
      setIsNewSupplierOpen(false);
      setNewSupplierName('');
      setNewPhone('');
      setNewContactPerson('');
      setNewGstin('');
      setSupplierErrors({});
      toast.success(`Supplier ${newSup.supplier_name} registered in database`);
    } catch (err: any) {
      toast.error('Failed to add supplier: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] text-xs font-semibold mb-2">
            <Truck className="w-3.5 h-3.5" />
            <span>Procurement &amp; Supply Chain Engine</span>
          </div>
          <h2 className="text-[26px] font-semibold text-[var(--text-main)] tracking-tight admin-page-heading">Purchase Orders &amp; Supplier Directory</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Track raw bullion inward, manufacturer invoices, net weights, and supplier liabilities.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewSupplierOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] rounded-lg text-[var(--text-main)] transition-colors"
          >
            <Plus className="w-4 h-4 text-[var(--gold-primary)]" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-color)] pb-2 text-xs">
        <button
          onClick={() => setActiveTab('inward')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'inward' 
              ? 'bg-[var(--gold-primary)] text-black' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          + Record Goods Inward (Purchase)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'history' 
              ? 'bg-[var(--gold-primary)] text-black' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          Purchase Register ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'suppliers' 
              ? 'bg-[var(--gold-primary)] text-black' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          Supplier Directory ({suppliers.length})
        </button>
      </div>

      {/* Tab: Inward Form */}
      {activeTab === 'inward' && (
        <form onSubmit={handleRecordPurchase} className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6">
          <h3 className="text-lg font-semibold text-[var(--text-main)] admin-section-heading">Procurement &amp; Metal Verification</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Supplier / Refinery *</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => {
                  setSelectedSupplierId(e.target.value);
                  if (purchaseErrors.supplier_id) {
                    setPurchaseErrors(prev => { const n = { ...prev }; delete n.supplier_id; return n; });
                  }
                }}
                aria-invalid={Boolean(purchaseErrors.supplier_id)}
                className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] ${
                  purchaseErrors.supplier_id ? 'border-rose-500' : 'border-[var(--border-color)]'
                }`}
              >
                <option value="">-- Select Registered Supplier --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.supplier_name} ({s.category})</option>
                ))}
              </select>
              <FormFieldError error={purchaseErrors.supplier_id} />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Supplier Invoice / DC Ref</label>
              <input
                type="text"
                placeholder="e.g. MMTC/INV-9921"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Commodity / Metal</label>
              <select
                value={metalType}
                onChange={(e) => setMetalType(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
              >
                <option value="Gold">Gold Bullion / Jewellery</option>
                <option value="Silver">Silver Fine 999</option>
                <option value="Platinum">Platinum 950</option>
                <option value="Diamonds">Certified Diamonds Lot</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Purity Hallmark Standard</label>
              <select
                value={purity}
                onChange={(e) => setPurity(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
              >
                <option value="24K (999)">24K (999.9 Fine Gold)</option>
                <option value="22K (916)">22K (BIS 916 Hallmarked)</option>
                <option value="18K (750)">18K (750 Diamond Casting)</option>
                <option value="999 Silver">Silver 999 Purity</option>
                <option value="950 Platinum">Platinum 950</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Gross Weight (Grams) *</label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                value={grossWeight}
                onChange={(e) => {
                  setGrossWeight(Number(e.target.value));
                  if (purchaseErrors.gross_weight || purchaseErrors.net_weight) {
                    setPurchaseErrors(prev => { const n = { ...prev }; delete n.gross_weight; delete n.net_weight; return n; });
                  }
                }}
                aria-invalid={Boolean(purchaseErrors.gross_weight)}
                className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-lg text-xs font-mono text-[var(--text-main)] ${
                  purchaseErrors.gross_weight ? 'border-rose-500' : 'border-[var(--border-color)]'
                }`}
              />
              <FormFieldError error={purchaseErrors.gross_weight} />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Net Metal Weight (Grams) *</label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                max={grossWeight > 0 ? grossWeight : undefined}
                value={netWeight}
                onChange={(e) => {
                  setNetWeight(Number(e.target.value));
                  if (purchaseErrors.net_weight) {
                    setPurchaseErrors(prev => { const n = { ...prev }; delete n.net_weight; return n; });
                  }
                }}
                aria-invalid={Boolean(purchaseErrors.net_weight)}
                className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-lg text-xs font-mono text-[var(--text-main)] ${
                  purchaseErrors.net_weight ? 'border-rose-500' : 'border-[var(--border-color)]'
                }`}
              />
              <FormFieldError error={purchaseErrors.net_weight} />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Purchase Rate / Gram (₹) *</label>
              <input
                type="number"
                step="1"
                min="1"
                value={ratePerGram}
                onChange={(e) => {
                  setRatePerGram(Number(e.target.value));
                  if (purchaseErrors.rate_per_gram) {
                    setPurchaseErrors(prev => { const n = { ...prev }; delete n.rate_per_gram; return n; });
                  }
                }}
                aria-invalid={Boolean(purchaseErrors.rate_per_gram)}
                className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-lg text-xs font-mono text-[var(--text-main)] ${
                  purchaseErrors.rate_per_gram ? 'border-rose-500' : 'border-[var(--border-color)]'
                }`}
              />
              <FormFieldError error={purchaseErrors.rate_per_gram} />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Amount Disbursed / Paid Now (₹)</label>
              <input
                type="number"
                step="1"
                min="0"
                max={computedTotal}
                value={paidAmount}
                onChange={(e) => {
                  setPaidAmount(Number(e.target.value));
                  if (purchaseErrors.paid_amount) {
                    setPurchaseErrors(prev => { const n = { ...prev }; delete n.paid_amount; return n; });
                  }
                }}
                aria-invalid={Boolean(purchaseErrors.paid_amount)}
                className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-lg text-xs font-mono text-[var(--text-main)] ${
                  purchaseErrors.paid_amount ? 'border-rose-500' : 'border-[var(--border-color)]'
                }`}
              />
              <FormFieldError error={purchaseErrors.paid_amount} />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Calculated Total Valuation</label>
              <div className="px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-base font-bold text-[var(--gold-primary)] font-mono">
                {formatCurrencyINR(computedTotal)}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Verification Notes &amp; Assay Certificate Details</label>
            <textarea
              rows={2}
              placeholder="Assay report number, purity test melt certificate, or batch remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[var(--gold-primary)] text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all shadow-md"
            >
              Verify &amp; Inward Stock ({formatCurrencyINR(computedTotal)})
            </button>
          </div>
        </form>
      )}

      {/* Tab: Purchase Register History */}
      {activeTab === 'history' && (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase text-[10px] tracking-wider border-b border-[var(--border-color)]">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4 text-right">Net Wt</th>
                <th className="py-3 px-4 text-right">Rate/g</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {purchases.map(p => (
                <tr key={p.id} className="hover:bg-[var(--bg-elevated)]/50">
                  <td className="py-3 px-4 font-mono font-bold text-[var(--text-main)]">{p.purchase_number}</td>
                  <td className="py-3 px-4 font-semibold text-[var(--text-main)]">{p.supplier_name}</td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">{p.metal_type} ({p.purity})</td>
                  <td className="py-3 px-4 text-right font-mono">{p.net_weight}g</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrencyINR(p.rate_per_gram)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[var(--gold-primary)]">{formatCurrencyINR(p.total_amount)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {p.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-[var(--text-secondary)]">{new Date(p.purchase_date).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <div key={s.id} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--gold-primary)]">{s.category}</span>
                  <h4 className="text-sm font-bold text-[var(--text-main)] mt-0.5">{s.supplier_name}</h4>
                  <p className="text-xs text-[var(--text-secondary)]">{s.contact_person}</p>
                </div>
                <Building2 className="w-5 h-5 text-[var(--gold-primary)]" />
              </div>

              <div className="space-y-1 text-xs text-[var(--text-secondary)] border-t border-[var(--border-color)] pt-2">
                <p>Phone: <span className="text-[var(--text-main)] font-mono">{s.phone}</span></p>
                <p>GSTIN: <span className="text-[var(--text-main)] font-mono">{s.gstin}</span></p>
                <p>City: <span className="text-[var(--text-main)]">{s.address}</span></p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--text-secondary)]">Outstanding Due:</span>
                <span className={`text-xs font-bold font-mono ${s.outstanding_balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatCurrencyINR(s.outstanding_balance)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      {isNewSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-main)] admin-section-heading">Add New Bullion / Gem Supplier</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Company / Refinery Name *</label>
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={(e) => {
                    setNewSupplierName(e.target.value);
                    if (supplierErrors.supplier_name) {
                      setSupplierErrors(prev => { const n = { ...prev }; delete n.supplier_name; return n; });
                    }
                  }}
                  placeholder="e.g. Royal Bullion Refiners Pvt Ltd"
                  minLength={2}
                  aria-invalid={Boolean(supplierErrors.supplier_name)}
                  className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-lg text-xs text-[var(--text-main)] ${
                    supplierErrors.supplier_name ? 'border-rose-500' : 'border-[var(--border-color)]'
                  }`}
                />
                <FormFieldError error={supplierErrors.supplier_name} />
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
                >
                  <option value="Bullion Refiner">Bullion Refiner</option>
                  <option value="Jewellery Manufacturer">Jewellery Manufacturer</option>
                  <option value="Gemstone Importer">Gemstone Importer</option>
                  <option value="Hallmarking Center">Hallmarking Center</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Contact Person</label>
                <input
                  type="text"
                  value={newContactPerson}
                  onChange={(e) => setNewContactPerson(e.target.value)}
                  placeholder="e.g. Anand Murugan"
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Mobile Contact *</label>
                <input
                  type="text"
                  inputMode="tel"
                  maxLength={15}
                  value={newPhone}
                  onChange={(e) => {
                    setNewPhone(e.target.value);
                    if (supplierErrors.phone) {
                      setSupplierErrors(prev => { const n = { ...prev }; delete n.phone; return n; });
                    }
                  }}
                  placeholder="e.g. 98400 12345"
                  aria-invalid={Boolean(supplierErrors.phone)}
                  className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-lg text-xs text-[var(--text-main)] ${
                    supplierErrors.phone ? 'border-rose-500' : 'border-[var(--border-color)]'
                  }`}
                />
                <FormFieldError error={supplierErrors.phone} />
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">GSTIN Number (Optional)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={newGstin}
                  onChange={(e) => {
                    setNewGstin(e.target.value.toUpperCase());
                    if (supplierErrors.gstin) {
                      setSupplierErrors(prev => { const n = { ...prev }; delete n.gstin; return n; });
                    }
                  }}
                  placeholder="33AAAAA0000A1Z5"
                  aria-invalid={Boolean(supplierErrors.gstin)}
                  className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border rounded-lg text-xs text-[var(--text-main)] uppercase ${
                    supplierErrors.gstin ? 'border-rose-500' : 'border-[var(--border-color)]'
                  }`}
                />
                <FormFieldError error={supplierErrors.gstin} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsNewSupplierOpen(false);
                  setSupplierErrors({});
                }}
                className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSupplier}
                className="px-4 py-2 bg-[var(--gold-primary)] text-black rounded-lg text-xs font-bold hover:brightness-105"
              >
                Save Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseSupplierSection;
