import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, Truck, FileText, CheckCircle2, 
  DollarSign, Package, Calendar, ArrowUpRight, Scale, ShieldCheck
} from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';
import { toast } from '../../utils/toast';
import { logAuditEvent } from '../../utils/rbac';

export interface SupplierRecord {
  id: string;
  supplier_name: string;
  contact_person: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  category: 'Bullion Refiner' | 'Jewellery Manufacturer' | 'Gemstone Importer' | 'Hallmarking Center';
  outstanding_balance: number;
  created_at: string;
}

export interface PurchaseInwardRecord {
  id: string;
  purchase_number: string;
  supplier_id: string;
  supplier_name: string;
  invoice_ref: string;
  metal_type: string;
  purity: string;
  gross_weight: number;
  net_weight: number;
  rate_per_gram: number;
  total_amount: number;
  paid_amount: number;
  payment_status: 'paid' | 'partial' | 'pending';
  purchase_date: string;
  notes?: string;
}

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

  // New Supplier Modal State
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [newCategory, setNewCategory] = useState<SupplierRecord['category']>('Bullion Refiner');

  useEffect(() => {
    loadSuppliers();
    loadPurchases();
  }, []);

  const loadSuppliers = () => {
    try {
      const raw = localStorage.getItem('rcb_suppliers');
      if (raw) {
        setSuppliers(JSON.parse(raw));
      } else {
        const defaults: SupplierRecord[] = [
          {
            id: 'sup-1',
            supplier_name: 'MMTC-PAMP India Bullion Refinery',
            contact_person: 'Ramesh Sundar',
            phone: '+91 98410 88210',
            email: 'bullion@mmtcpamp.in',
            gstin: '33AABCM8291K1Z3',
            address: 'Industrial Bullion Complex, Chennai',
            category: 'Bullion Refiner',
            outstanding_balance: 0,
            created_at: '2024-01-10T00:00:00.000Z'
          },
          {
            id: 'sup-2',
            supplier_name: 'Emerald Jewel Industry India Ltd',
            contact_person: 'K. Srinivasan',
            phone: '+91 94432 19020',
            email: 'procurement@ejindia.com',
            gstin: '33AABCE1289P1Z9',
            address: 'Rakkiyapalayam, Coimbatore - 641029',
            category: 'Jewellery Manufacturer',
            outstanding_balance: 245000,
            created_at: '2024-01-15T00:00:00.000Z'
          },
          {
            id: 'sup-3',
            supplier_name: 'DTC Surat Diamond Importers',
            contact_person: 'Bhavin Patel',
            phone: '+91 98251 77301',
            email: 'stones@suratdiamonds.in',
            gstin: '24AABCD4419M1Z8',
            address: 'Diamond Bourse, Surat, Gujarat',
            category: 'Gemstone Importer',
            outstanding_balance: 180000,
            created_at: '2024-02-01T00:00:00.000Z'
          }
        ];
        setSuppliers(defaults);
        localStorage.setItem('rcb_suppliers', JSON.stringify(defaults));
      }
    } catch {
      // Ignore
    }
  };

  const loadPurchases = () => {
    try {
      const raw = localStorage.getItem('rcb_purchases');
      if (raw) {
        setPurchases(JSON.parse(raw));
      } else {
        const defaults: PurchaseInwardRecord[] = [
          {
            id: 'pur-1',
            purchase_number: 'PO-2026-0041',
            supplier_id: 'sup-1',
            supplier_name: 'MMTC-PAMP India Bullion Refinery',
            invoice_ref: 'MMTC/2026/8892',
            metal_type: 'Gold',
            purity: '24K (999)',
            gross_weight: 250,
            net_weight: 250,
            rate_per_gram: 7850,
            total_amount: 1962500,
            paid_amount: 1962500,
            payment_status: 'paid',
            purchase_date: new Date(Date.now() - 86400000 * 2).toISOString(),
            notes: 'Raw Bullion bars 999.9 purity for wedding season casting'
          }
        ];
        setPurchases(defaults);
        localStorage.setItem('rcb_purchases', JSON.stringify(defaults));
      }
    } catch {
      // Ignore
    }
  };

  const computedTotal = Math.round(netWeight * ratePerGram);

  const handleRecordPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      toast.error('Please select an authorized supplier');
      return;
    }
    if (netWeight <= 0 || ratePerGram <= 0) {
      toast.error('Please provide valid weight and purchase rate');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    const newPO: PurchaseInwardRecord = {
      id: `pur-${Date.now()}`,
      purchase_number: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
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

    const updatedPurchases = [newPO, ...purchases];
    setPurchases(updatedPurchases);
    localStorage.setItem('rcb_purchases', JSON.stringify(updatedPurchases));

    // Update supplier outstanding if partial/pending
    const unpaid = Math.max(0, computedTotal - paidAmount);
    if (unpaid > 0) {
      const updatedSuppliers = suppliers.map(s => s.id === supplier.id ? { ...s, outstanding_balance: s.outstanding_balance + unpaid } : s);
      setSuppliers(updatedSuppliers);
      localStorage.setItem('rcb_suppliers', JSON.stringify(updatedSuppliers));
    }

    logAuditEvent(
      'GOODS_INWARD_RECORDED',
      'purchases',
      `Purchased ${netWeight}g ${metalType} (${purity}) from ${supplier.supplier_name} for ₹${computedTotal.toLocaleString('en-IN')}`,
      'admin@luxury.com',
      'admin',
      'info'
    );

    toast.success(`Purchase Inward ${newPO.purchase_number} recorded`);
    setInvoiceRef('');
    setGrossWeight(100);
    setNetWeight(100);
    setPaidAmount(0);
    setNotes('');
    setActiveTab('history');
  };

  const handleCreateSupplier = () => {
    if (!newSupplierName.trim() || !newPhone.trim()) {
      toast.error('Supplier name and phone are required');
      return;
    }
    const newSup: SupplierRecord = {
      id: `sup-${Date.now()}`,
      supplier_name: newSupplierName.trim(),
      contact_person: newContactPerson.trim() || 'Managing Partner',
      phone: newPhone.trim(),
      email: `${newSupplierName.toLowerCase().replace(/[^a-z]/g, '')}@supplier.in`,
      gstin: newGstin.trim() || '33AAAAA0000A1Z5',
      address: 'Jewellery Bazaar, Coimbatore',
      category: newCategory,
      outstanding_balance: 0,
      created_at: new Date().toISOString()
    };
    const updated = [newSup, ...suppliers];
    setSuppliers(updated);
    localStorage.setItem('rcb_suppliers', JSON.stringify(updated));
    setSelectedSupplierId(newSup.id);
    setIsNewSupplierOpen(false);
    setNewSupplierName('');
    setNewPhone('');
    setNewContactPerson('');
    setNewGstin('');
    toast.success(`Supplier ${newSup.supplier_name} added`);
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
          <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">Purchase Orders &amp; Supplier Directory</h2>
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
          <h3 className="text-base font-serif font-bold text-[var(--text-main)]">Procurement &amp; Metal Verification</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Supplier / Refinery *</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
              >
                <option value="">-- Select Registered Supplier --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.supplier_name} ({s.category})</option>
                ))}
              </select>
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
                value={grossWeight}
                onChange={(e) => setGrossWeight(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Net Metal Weight (Grams) *</label>
              <input
                type="number"
                step="0.01"
                value={netWeight}
                onChange={(e) => setNetWeight(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Purchase Rate / Gram (₹) *</label>
              <input
                type="number"
                value={ratePerGram}
                onChange={(e) => setRatePerGram(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">Amount Disbursed / Paid Now (₹)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)]"
              />
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
            <h3 className="text-base font-serif font-bold text-[var(--text-main)]">Add New Bullion / Gem Supplier</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Company / Refinery Name *</label>
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="e.g. Royal Bullion Refiners Pvt Ltd"
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
                />
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
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 98400 12345"
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={newGstin}
                  onChange={(e) => setNewGstin(e.target.value)}
                  placeholder="33AAAAA0000A1Z5"
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] uppercase"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewSupplierOpen(false)}
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
