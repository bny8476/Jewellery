import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Plus, User, Check, Printer, 
  Trash2, CreditCard, Banknote, QrCode, ArrowRight, 
  ShieldCheck, FileCheck, RefreshCw, Sparkles, AlertCircle
} from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';
import { localJewelryItems } from '../../utils/localData';
import { getCustomers } from '../../services/customerService';
import type { Customer } from '../../types/pawnshop';
import type { JewelryItem } from '../../lib/supabase';
import { toast } from '../../utils/toast';
import { logAuditEvent } from '../../utils/rbac';

export interface PosSaleRecord {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{
    item_id: string;
    name: string;
    category: string;
    metal_type: string;
    purity?: string;
    weight: number;
    price: number;
    making_charge: number;
    quantity: number;
  }>;
  subtotal: number;
  making_charges_total: number;
  hallmarking_fee: number;
  discount: number;
  tax_amount: number; // 3% GST
  final_amount: number;
  payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer';
  payment_reference?: string;
  created_at: string;
}

export const SalesBillingSection: React.FC = () => {
  // Inventory state
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [searchItem, setSearchItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Cart / Bill items
  const [billItems, setBillItems] = useState<Array<{
    item: JewelryItem;
    quantity: number;
    making_charge: number;
  }>>([]);

  // Billing parameters
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('upi');
  const [paymentRef, setPaymentRef] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<PosSaleRecord | null>(null);

  // Quick Customer Registration Modal
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Load Inventory & Customers
  useEffect(() => {
    loadInventory();
    loadCustomers();
  }, []);

  const loadInventory = () => {
    try {
      const raw = localStorage.getItem('rcb_admin_inventory');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          return;
        }
      }
      setItems(localJewelryItems);
    } catch {
      setItems(localJewelryItems);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      if (data && data.length > 0) {
        setCustomers(data);
      }
    } catch {
      // Fallback
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchItem.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchItem.toLowerCase()) ||
                          (item.purity && item.purity.toLowerCase().includes(searchItem.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat && (item.in_stock !== false);
  });

  const filteredCustomers = searchCustomer.trim() ? customers.filter(c => 
    c.full_name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    c.phone.includes(searchCustomer) ||
    c.customer_code.toLowerCase().includes(searchCustomer.toLowerCase())
  ).slice(0, 5) : [];

  const handleAddItemToBill = (item: JewelryItem) => {
    const existingIndex = billItems.findIndex(b => b.item.id === item.id);
    if (existingIndex >= 0) {
      toast.info('Item is already in active bill');
      return;
    }
    const defaultMakingCharge = Math.round(item.price * (item.wastage_percent ? item.wastage_percent / 100 : 0.08));
    setBillItems(prev => [...prev, {
      item,
      quantity: 1,
      making_charge: defaultMakingCharge
    }]);
  };

  const handleRemoveBillItem = (id: string) => {
    setBillItems(prev => prev.filter(b => b.item.id !== id));
  };

  const handleUpdateMakingCharge = (id: string, val: number) => {
    setBillItems(prev => prev.map(b => b.item.id === id ? { ...b, making_charge: Math.max(0, val) } : b));
  };

  // Pricing calculations
  const subtotal = billItems.reduce((sum, b) => sum + (b.item.price * b.quantity), 0);
  const totalMakingCharges = billItems.reduce((sum, b) => sum + (b.making_charge * b.quantity), 0);
  const hallmarkingFee = billItems.length * 45; // BIS ₹45 per gold piece standard
  const taxableAmount = Math.max(0, subtotal + totalMakingCharges + hallmarkingFee - discount);
  const gstAmount = Math.round(taxableAmount * 0.03); // 3% GST on Gold/Silver Jewellery in India
  const finalPayable = taxableAmount + gstAmount;

  const handleCreateCustomer = () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      toast.error('Customer name and 10-digit mobile number are required');
      return;
    }
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      customer_code: `CUST${Math.floor(1000 + Math.random() * 9000)}`,
      full_name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim() || 'Showroom In-Store Client',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setCustomers(prev => [newCust, ...prev]);
    setSelectedCustomer(newCust);
    setIsQuickCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    toast.success(`Client ${newCust.full_name} registered`);
  };

  const handleCompleteSale = () => {
    if (billItems.length === 0) {
      toast.error('Please add at least one jewellery piece to the bill');
      return;
    }

    setIsProcessing(true);

    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const saleRecord: PosSaleRecord = {
        id: `sale-${Date.now()}`,
        invoice_number: invoiceNumber,
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.full_name || 'Counter Patron / Private Client',
        customer_phone: selectedCustomer?.phone || '+91 Direct Walk-In',
        items: billItems.map(b => ({
          item_id: b.item.id,
          name: b.item.name,
          category: b.item.category,
          metal_type: b.item.metal_type,
          purity: b.item.purity,
          weight: b.item.weight,
          price: b.item.price,
          making_charge: b.making_charge,
          quantity: b.quantity
        })),
        subtotal,
        making_charges_total: totalMakingCharges,
        hallmarking_fee: hallmarkingFee,
        discount,
        tax_amount: gstAmount,
        final_amount: finalPayable,
        payment_method: paymentMethod,
        payment_reference: paymentRef || `TXN-${Date.now()}`,
        created_at: new Date().toISOString()
      };

      // 1. Persist sale to local storage sales ledger
      const rawSales = localStorage.getItem('rcb_pos_sales');
      const sales = rawSales ? JSON.parse(rawSales) : [];
      sales.unshift(saleRecord);
      localStorage.setItem('rcb_pos_sales', JSON.stringify(sales));

      // 2. Decrement inventory stock atomically
      const updatedInventory = items.map(invItem => {
        const soldItem = billItems.find(b => b.item.id === invItem.id);
        if (soldItem) {
          return {
            ...invItem,
            in_stock: false // Unique jewellery pieces marked sold
          };
        }
        return invItem;
      });
      setItems(updatedInventory);
      localStorage.setItem('rcb_admin_inventory', JSON.stringify(updatedInventory));

      // 3. Record audit log
      logAuditEvent(
        'SALE_INVOICE_GENERATED',
        'sales_pos',
        `Invoice ${invoiceNumber} finalized for ₹${finalPayable.toLocaleString('en-IN')} (${paymentMethod.toUpperCase()})`,
        'admin@luxury.com',
        'admin',
        'info'
      );

      setLastInvoice(saleRecord);
      setBillItems([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setPaymentRef('');
      toast.success(`Tax Invoice ${invoiceNumber} created & inventory updated`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to complete sale: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Point of Sale (POS) Billing Engine</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">Retail Sales, Invoicing & Tax Billing</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Compliant with BIS Hallmarking standard & 3% Gold/Silver GST calculation.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuickCustomerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] rounded-lg text-[var(--text-main)] transition-colors"
          >
            <User className="w-4 h-4 text-[var(--gold-primary)]" />
            <span>Quick Register Client</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left Item Selector, Right Active Bill */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Product Catalog Picker (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search pieces by name, purity, category or SKU..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
              >
                <option value="all">All Categories</option>
                <option value="Bridal Sets">Bridal Sets</option>
                <option value="Necklaces">Necklaces</option>
                <option value="Bangles">Bangles & Kadas</option>
                <option value="Earrings">Earrings</option>
                <option value="Rings">Rings</option>
                <option value="Bullion">Bullion & Coins</option>
              </select>
            </div>

            {/* Inventory Pieces Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-h-[520px] overflow-y-auto pr-1">
              {filteredItems.map(item => {
                const isInBill = billItems.some(b => b.item.id === item.id);
                return (
                  <div 
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                      isInBill 
                        ? 'bg-[var(--gold-primary)]/10 border-[var(--gold-primary)]/50' 
                        : 'bg-[var(--bg-elevated)] border-[var(--border-color)] hover:border-[var(--gold-primary)]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--gold-primary)]">
                          {item.purity || item.metal_type}
                        </span>
                        <span className="text-[11px] text-[var(--text-secondary)] font-mono">{item.weight}g</span>
                      </div>
                      <h4 className="text-xs font-semibold text-[var(--text-main)] line-clamp-1">{item.name}</h4>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{item.category}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border-color)]/60">
                      <span className="text-sm font-bold text-[var(--gold-primary)] tabular-nums">
                        {formatCurrencyINR(item.price)}
                      </span>
                      <button
                        onClick={() => handleAddItemToBill(item)}
                        disabled={isInBill}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          isInBill 
                            ? 'bg-[var(--gold-primary)] text-black cursor-default'
                            : 'bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--gold-primary)] hover:text-black text-[var(--text-main)]'
                        }`}
                      >
                        {isInBill ? 'Added ✓' : '+ Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Bill & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
            
            {/* Customer Search / Selection */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1.5">
                Client / Patron Identification
              </label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/40">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--gold-primary)]" />
                    <div>
                      <p className="text-xs font-bold text-[var(--text-main)]">{selectedCustomer.full_name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">{selectedCustomer.phone} • {selectedCustomer.customer_code}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedCustomer(null)}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search client by name, mobile (+91)..."
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                  />
                  {filteredCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg shadow-xl z-20 overflow-hidden">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setSearchCustomer('');
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[var(--gold-primary)]/10 text-xs flex justify-between items-center border-b border-[var(--border-color)] last:border-0"
                        >
                          <span className="font-semibold text-[var(--text-main)]">{c.full_name}</span>
                          <span className="text-[10px] text-[var(--text-secondary)]">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bill Items List */}
            <div className="border-t border-[var(--border-color)] pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--text-main)]">Invoice Line Items ({billItems.length})</span>
                {billItems.length > 0 && (
                  <button 
                    onClick={() => setBillItems([])}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Clear Bill
                  </button>
                )}
              </div>

              {billItems.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-[var(--border-color)] rounded-lg">
                  <ShoppingBag className="w-8 h-8 text-[var(--text-secondary)]/50 mx-auto mb-2" />
                  <p className="text-xs text-[var(--text-secondary)]">No jewellery pieces selected.</p>
                  <p className="text-[10px] text-[var(--text-secondary)]/70 mt-0.5">Click '+ Add' from the catalog to build invoice.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {billItems.map(({ item, making_charge }) => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-main)] truncate">{item.name}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] font-mono">{item.weight}g • {item.purity || item.metal_type}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-bold text-[var(--text-main)] tabular-nums">{formatCurrencyINR(item.price)}</span>
                          <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                            <span>MC:</span>
                            <input
                              type="number"
                              value={making_charge}
                              onChange={(e) => handleUpdateMakingCharge(item.id, Number(e.target.value))}
                              className="w-14 px-1 py-0.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-[10px] text-right font-mono"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveBillItem(item.id)}
                          className="p-1 text-[var(--text-secondary)] hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-[var(--border-color)] pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Gold/Silver Base Cost:</span>
                <span className="font-mono text-[var(--text-main)]">{formatCurrencyINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Making Charges Total:</span>
                <span className="font-mono text-[var(--text-main)]">{formatCurrencyINR(totalMakingCharges)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>BIS Hallmarking (₹45/pc):</span>
                <span className="font-mono text-[var(--text-main)]">{formatCurrencyINR(hallmarkingFee)}</span>
              </div>
              <div className="flex justify-between items-center text-[var(--text-secondary)]">
                <span>Special Discount (₹):</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-20 px-2 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded text-xs text-right font-mono text-[var(--text-main)]"
                />
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>GST (3% on Jewellery):</span>
                <span className="font-mono text-[var(--text-main)]">{formatCurrencyINR(gstAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[var(--gold-primary)] pt-2 border-t border-[var(--border-color)]">
                <span>Net Total Payable:</span>
                <span className="font-mono">{formatCurrencyINR(finalPayable)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="border-t border-[var(--border-color)] pt-3">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-2">
                Settlement Tender Method
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'upi', label: 'UPI / QR', icon: QrCode },
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'card', label: 'Card / POS', icon: CreditCard },
                  { id: 'bank_transfer', label: 'NEFT / RTGS', icon: ShieldCheck }
                ].map(m => {
                  const Icon = m.icon;
                  const isSel = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded-lg text-center flex flex-col items-center gap-1 border transition-all ${
                        isSel 
                          ? 'bg-[var(--gold-primary)] text-black border-[var(--gold-primary)] font-bold' 
                          : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod !== 'cash' && (
                <input
                  type="text"
                  placeholder="Payment transaction ID / Reference number..."
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full mt-2 px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] font-mono"
                />
              )}
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleCompleteSale}
              disabled={isProcessing || billItems.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--gold-primary)] via-[#E6CA85] to-[var(--gold-primary)] text-black font-bold text-xs uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Finalizing & Generating Invoice...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Confirm Sale & Print Invoice ({formatCurrencyINR(finalPayable)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Register Client Modal */}
      {isQuickCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-serif font-bold text-[var(--text-main)]">Register Showroom Client</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Full Patron Name *</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Smt. Meenakshi Sundaram"
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Mobile Contact (+91) *</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 98401 23456"
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Residential / Delivery Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Street, City, Pin Code"
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsQuickCustomerOpen(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomer}
                className="px-4 py-2 bg-[var(--gold-primary)] text-black rounded-lg text-xs font-bold hover:brightness-105"
              >
                Register & Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal preview if sale just concluded */}
      {lastInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#FAF7F2] text-[#1E1B18] rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-[#D4AF37]/40 space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-black/10 pb-4">
              <div>
                <h1 className="text-xl font-serif font-black tracking-widest text-[#8A6A27]">RCB JEWELRY’S &amp; PAWN SHOP</h1>
                <p className="text-[10px] tracking-widest uppercase text-black/60 font-semibold">Trust • Tradition • Timeless Beauty</p>
                <p className="text-xs text-black/70 mt-1">Cross Cut Road, Gandhipuram, Coimbatore - 641012</p>
                <p className="text-xs text-black/70">GSTIN: 33AAACR2938K1Z5 • BIS Hallmarked Licence: HM/C-762910</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-[#8A6A27] text-white text-[10px] font-bold uppercase tracking-wider">
                  Original Tax Invoice
                </span>
                <p className="text-xs font-mono font-bold mt-1 text-black">{lastInvoice.invoice_number}</p>
                <p className="text-[11px] text-black/60">{new Date(lastInvoice.created_at).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {/* Billed To */}
            <div className="p-3 bg-black/5 rounded-lg text-xs flex justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-black/50 block">Billed To (Patron):</span>
                <p className="font-bold text-sm text-black">{lastInvoice.customer_name}</p>
                <p className="text-black/70">{lastInvoice.customer_phone}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Payment Method:</span>
                <p className="font-bold uppercase text-black">{lastInvoice.payment_method}</p>
                <p className="text-black/70 font-mono">{lastInvoice.payment_reference}</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black/20 text-left text-[10px] uppercase tracking-wider text-black/60">
                  <th className="py-2">Item Description</th>
                  <th className="py-2">Purity / Spec</th>
                  <th className="py-2 text-right">Net Wt</th>
                  <th className="py-2 text-right">Making Chg</th>
                  <th className="py-2 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {lastInvoice.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-semibold text-black">{it.name}</td>
                    <td className="py-2.5 text-black/70">{it.purity || it.metal_type}</td>
                    <td className="py-2.5 text-right font-mono">{it.weight}g</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrencyINR(it.making_charge)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-black">{formatCurrencyINR(it.price + it.making_charge)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-black/20 pt-3 flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-black/70">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrencyINR(lastInvoice.subtotal + lastInvoice.making_charges_total)}</span>
                </div>
                <div className="flex justify-between text-black/70">
                  <span>BIS Hallmarking:</span>
                  <span className="font-mono">{formatCurrencyINR(lastInvoice.hallmarking_fee)}</span>
                </div>
                {lastInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatCurrencyINR(lastInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-black/70">
                  <span>GST (3%):</span>
                  <span className="font-mono">{formatCurrencyINR(lastInvoice.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-black pt-2 border-t border-black/20">
                  <span>Grand Total:</span>
                  <span className="font-mono text-[#8A6A27]">{formatCurrencyINR(lastInvoice.final_amount)}</span>
                </div>
              </div>
            </div>

            {/* BIS Declaration */}
            <div className="text-[10px] text-black/60 border-t border-black/10 pt-3">
              <p>• Certified 100% BIS Hallmarked 22K (916) / 18K (750) Jewellery with Unique HUID Laser Engraved Identification.</p>
              <p>• Goods once sold can be exchanged within 7 days against authentic tax invoice as per RCB Gold Buyback & Exchange policy.</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setLastInvoice(null)}
                className="px-4 py-2 bg-black/10 hover:bg-black/20 rounded-lg text-xs font-semibold text-black"
              >
                Close Preview
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#8A6A27] hover:bg-[#6D531E] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Tax Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesBillingSection;
