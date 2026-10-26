import { useState, useEffect } from 'react';
import { 
  Gift, 
  Sparkles, 
  Copy, 
  ExternalLink, 
  Send, 
  RefreshCw, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight, 
  ArrowDownLeft 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { giftCardService, GiftCardRecord } from '../../services/giftCardService';
import { toast } from '../../utils/toast';

export function CustomerGiftCardsTab() {
  const [purchasedCards, setPurchasedCards] = useState<GiftCardRecord[]>([]);
  const [receivedCards, setReceivedCards] = useState<GiftCardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PURCHASED' | 'RECEIVED'>('ALL');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await giftCardService.getMyGiftCards();
      if (res.success) {
        setPurchasedCards(res.purchased || []);
        setReceivedCards(res.received || []);
      }
    } catch (err: any) {
      console.warn('Error fetching customer gift cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Gift card code copied to clipboard!');
  };

  const handleResend = async (id: string, email: string) => {
    try {
      setResendingId(id);
      const res = await giftCardService.resendCard(id);
      if (res.success) {
        toast.success(res.message || `Digital gift card dispatched to ${email}`);
      } else {
        toast.error(res.error || 'Failed to resend card');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error communicating with delivery provider');
    } finally {
      setResendingId(null);
    }
  };

  const allCards = [
    ...purchasedCards.map(c => ({ ...c, relationship: 'PURCHASED' })),
    ...receivedCards.map(c => ({ ...c, relationship: 'RECEIVED' }))
  ];

  const displayedCards = allCards.filter(c => {
    if (activeFilter === 'PURCHASED') return c.relationship === 'PURCHASED';
    if (activeFilter === 'RECEIVED') return c.relationship === 'RECEIVED';
    return true;
  });

  // Calculate Patron Portfolio Stats
  const totalAvailableBalance = allCards.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  const totalOriginalValue = allCards.reduce((sum, c) => sum + (c.original_value || 0), 0);
  const totalRedeemedValue = totalOriginalValue - totalAvailableBalance;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#C9A45C] text-[10px] font-semibold tracking-widest uppercase mb-1.5">
            <Gift className="w-3.5 h-3.5" />
            PATRON GIFT CARD VAULT
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#351018] dark:text-[#E6C687]">
            My Gift Cards & Certificates
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Manage purchased luxury gift cards, track received balances, and review double-entry audit ledgers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCards}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:border-[#C9A45C]/50 text-[var(--text-secondary)] transition-all cursor-pointer"
            title="Refresh Vault Balances"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#C9A45C]' : ''}`} />
          </button>
          <Link
            to="/gift-cards"
            className="px-5 py-2.5 bg-gradient-to-r from-[#C9A45C] to-[#E6C687] text-[#351018] font-bold text-xs rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Buy New Gift Card
          </Link>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1418] border border-[var(--border-subtle)] shadow-sm space-y-1">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-[var(--text-secondary)]">
            Total Spendable Balance
          </span>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-[#351018] dark:text-[#E6C687]">
            ₹{totalAvailableBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-emerald-600 font-medium">Ready for immediate checkout</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1418] border border-[var(--border-subtle)] shadow-sm space-y-1">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-[var(--text-secondary)]">
            Active Gift Cards
          </span>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-main)]">
            {allCards.filter(c => c.status === 'ACTIVE' || c.status === 'PARTIALLY_REDEEMED').length}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)]">{allCards.length} total cards issued / received</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1418] border border-[var(--border-subtle)] shadow-sm space-y-1">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-[var(--text-secondary)]">
            Total Redeemed Value
          </span>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-main)]">
            ₹{totalRedeemedValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)]">Applied toward jewellery purchases</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-[#351018] text-[#E6C687] dark:bg-[#C9A45C] dark:text-[#351018] font-bold shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
          }`}
        >
          All Cards ({allCards.length})
        </button>
        <button
          onClick={() => setActiveFilter('PURCHASED')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeFilter === 'PURCHASED'
              ? 'bg-[#351018] text-[#E6C687] dark:bg-[#C9A45C] dark:text-[#351018] font-bold shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
          }`}
        >
          Purchased by Me ({purchasedCards.length})
        </button>
        <button
          onClick={() => setActiveFilter('RECEIVED')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeFilter === 'RECEIVED'
              ? 'bg-[#351018] text-[#E6C687] dark:bg-[#C9A45C] dark:text-[#351018] font-bold shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
          }`}
        >
          Received as Gifts ({receivedCards.length})
        </button>
      </div>

      {/* Gift Cards List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#C9A45C] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-[#C9A45C] font-semibold">Loading Vault Cards...</p>
        </div>
      ) : displayedCards.length === 0 ? (
        <div className="py-16 px-4 bg-white dark:bg-[#1E1418] rounded-3xl border border-dashed border-[#C9A45C]/40 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#C9A45C]/15 text-[#C9A45C] flex items-center justify-center mx-auto">
            <Gift className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">No Gift Cards in this View</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            {activeFilter === 'RECEIVED'
              ? 'You have not yet received any gift cards under this email address. When someone gifts you a YAZHINI card, it will automatically appear here.'
              : 'Gift the joy of choice. Present your cherished family and friends with an authentic 24K gold YAZHINI gift card.'}
          </p>
          <Link
            to="/gift-cards"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#351018] dark:bg-[#C9A45C] text-[#E6C687] dark:text-[#351018] font-bold text-xs rounded-xl shadow-md hover:scale-105 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Explore Gift Card Designs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedCards.map((card) => {
            const isExpanded = expandedCardId === card.id;
            const bgGradient = card.design?.bgGradient || 'linear-gradient(135deg, #1C120C 0%, #351018 50%, #150A0E 100%)';

            return (
              <div
                key={card.id}
                className="bg-white dark:bg-[#1E1418] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden hover:border-[#C9A45C]/40 transition-all"
              >
                {/* Main Card Header Bar */}
                <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    {/* Visual Miniature Card Art */}
                    <div
                      className="w-16 h-11 rounded-lg shrink-0 flex items-center justify-center text-white text-[8px] font-serif font-bold uppercase tracking-wider shadow-md border border-[#C9A45C]/30 relative overflow-hidden"
                      style={{ background: bgGradient }}
                    >
                      <span className="relative z-10">YAZHINI</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[var(--text-main)] tracking-wider">
                          {card.code}
                        </span>
                        <button
                          onClick={() => handleCopy(card.code)}
                          className="p-1 rounded text-[var(--text-secondary)] hover:text-[#C9A45C] transition-colors cursor-pointer"
                          title="Copy Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            card.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : card.status === 'PARTIALLY_REDEEMED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : card.status === 'FULLY_REDEEMED'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {card.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {card.relationship === 'PURCHASED'
                          ? `Gifted to ${card.recipient_name} (${card.recipient_email})`
                          : `Received from ${card.purchaser_name || 'Valued Patron'}`}
                      </p>
                    </div>
                  </div>

                  {/* Financials & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-mono block">
                        Available Balance
                      </span>
                      <p className="text-xl font-bold font-serif text-[#351018] dark:text-[#E6C687]">
                        ₹{card.current_balance.toLocaleString('en-IN')}
                      </p>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        Original: ₹{card.original_value.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/gift-card/${card.code}`}
                        className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#C9A45C]/15 border border-[var(--border-subtle)] text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#C9A45C]" />
                        <span>View Card</span>
                      </Link>

                      {card.relationship === 'PURCHASED' && card.delivery_method === 'EMAIL' && (
                        <button
                          onClick={() => handleResend(card.id, card.recipient_email)}
                          disabled={resendingId === card.id}
                          className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#C9A45C]/15 border border-[var(--border-subtle)] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Send className={`w-3.5 h-3.5 text-[#C9A45C] ${resendingId === card.id ? 'animate-spin' : ''}`} />
                          <span>Resend Email</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                        className="p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[#C9A45C] transition-colors cursor-pointer"
                        title="Toggle Transaction Ledger"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Transaction Ledger & Detail Drawer */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-black/5 dark:bg-black/30 border-t border-[var(--border-subtle)] space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C9A45C]" />
                        Double-Entry Transaction History
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        Expires:{' '}
                        {new Date(card.expires_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {card.transactions && card.transactions.length > 0 ? (
                      <div className="space-y-2">
                        {card.transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="p-3 rounded-xl bg-white dark:bg-[#1E1418] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                  tx.amount > 0
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {tx.amount > 0 ? (
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--text-main)]">
                                  {tx.transaction_type}: {tx.reason || 'Balance movement'}
                                </p>
                                <p className="text-[10px] text-[var(--text-secondary)]">
                                  {tx.order_number ? `Order: ${tx.order_number} • ` : ''}
                                  {new Date(tx.created_at).toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`font-mono font-bold ${
                                  tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {tx.amount > 0 ? `+₹${tx.amount.toLocaleString('en-IN')}` : `-₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                              </span>
                              <p className="text-[10px] text-[var(--text-secondary)]">
                                Bal: ₹{tx.balance_after.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)] italic">
                        No transactions recorded on this card yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
