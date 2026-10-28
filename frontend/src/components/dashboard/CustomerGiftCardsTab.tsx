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

  // Calculate stats
  const totalAvailableBalance = allCards.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  const totalOriginalValue = allCards.reduce((sum, c) => sum + (c.original_value || 0), 0);
  const totalRedeemedValue = totalOriginalValue - totalAvailableBalance;

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E7EB] pb-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-[#25282D]">
            Gift Cards &amp; Certificates
          </h1>
          <p className="text-xs text-[#8792A2] mt-0.5">
            Manage purchased gift cards, track active balances, and review redemption history
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCards}
            disabled={loading}
            className="p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#8792A2] hover:text-[#25282D] hover:border-[#25282D] transition-colors cursor-pointer shadow-xs"
            title="Refresh Balances"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#25282D]' : ''}`} />
          </button>
          <Link
            to="/gift-cards"
            className="px-4 py-2.5 bg-[#25282D] hover:bg-black text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Buy Gift Card</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8792A2]">
            Available Balance
          </span>
          <p className="text-2xl sm:text-3xl font-inter font-bold text-[#25282D]">
            ₹{totalAvailableBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-emerald-600 font-medium">Ready for checkout redemption</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8792A2]">
            Active Cards
          </span>
          <p className="text-2xl sm:text-3xl font-inter font-bold text-[#25282D]">
            {allCards.filter(c => c.status === 'ACTIVE' || c.status === 'PARTIALLY_REDEEMED').length}
          </p>
          <p className="text-[10px] text-[#8792A2]">{allCards.length} total cards issued / received</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8792A2]">
            Total Redeemed Value
          </span>
          <p className="text-2xl sm:text-3xl font-inter font-bold text-[#25282D]">
            ₹{totalRedeemedValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-[#8792A2]">Applied toward jewellery purchases</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-[#25282D] text-white shadow-xs'
              : 'text-[#8792A2] hover:text-[#25282D]'
          }`}
        >
          All Cards ({allCards.length})
        </button>
        <button
          onClick={() => setActiveFilter('PURCHASED')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeFilter === 'PURCHASED'
              ? 'bg-[#25282D] text-white shadow-xs'
              : 'text-[#8792A2] hover:text-[#25282D]'
          }`}
        >
          Purchased ({purchasedCards.length})
        </button>
        <button
          onClick={() => setActiveFilter('RECEIVED')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeFilter === 'RECEIVED'
              ? 'bg-[#25282D] text-white shadow-xs'
              : 'text-[#8792A2] hover:text-[#25282D]'
          }`}
        >
          Received ({receivedCards.length})
        </button>
      </div>

      {/* Gift Cards List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#25282D] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-wider text-[#8792A2] font-semibold">Loading Gift Cards...</p>
        </div>
      ) : displayedCards.length === 0 ? (
        <div className="py-16 px-4 bg-white rounded-xl border border-[#E5E7EB] text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#F3F4F6] text-[#8792A2] flex items-center justify-center mx-auto">
            <Gift className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-inter font-bold text-[#25282D]">No Gift Cards Found</h3>
          <p className="text-xs text-[#8792A2] max-w-md mx-auto">
            {activeFilter === 'RECEIVED'
              ? 'You have not yet received any gift cards under this email address. When someone gifts you a YAZHINI card, it will automatically appear here.'
              : 'Present your family and friends with an authentic YAZHINI fine jewellery gift card.'}
          </p>
          <Link
            to="/gift-cards"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25282D] hover:bg-black text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Explore Gift Cards</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedCards.map((card) => {
            const isExpanded = expandedCardId === card.id;

            return (
              <div
                key={card.id}
                className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden hover:border-[#25282D] transition-all"
              >
                {/* Main Card Header Bar */}
                <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    {/* Visual Miniature Card Art */}
                    <div
                      className="w-14 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-[8px] font-inter font-bold uppercase tracking-wider shadow-xs border border-[#25282D] bg-[#25282D] relative overflow-hidden"
                    >
                      <span className="text-[#C9A45C] tracking-widest">YAZHINI</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-[#25282D] tracking-wider">
                          {card.code}
                        </span>
                        <button
                          onClick={() => handleCopy(card.code)}
                          className="p-1 rounded text-[#8792A2] hover:text-[#25282D] transition-colors cursor-pointer"
                          title="Copy Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            card.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : card.status === 'PARTIALLY_REDEEMED'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : card.status === 'FULLY_REDEEMED'
                              ? 'bg-stone-100 text-stone-700 border-stone-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {card.status.replace('_', ' ')}
                        </span>
                        {card.pin && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#8792A2] border border-[#E5E7EB]">
                            PIN: <strong className="text-[#25282D]">{card.pin}</strong>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8792A2] mt-0.5">
                        {card.relationship === 'PURCHASED'
                          ? `Gifted to ${card.recipient_name} (${card.recipient_email})`
                          : `Received from ${card.purchaser_name || 'Valued Patron'}`}
                      </p>
                    </div>
                  </div>

                  {/* Financials & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-[#8792A2] uppercase tracking-wider font-mono block">
                        Available Balance
                      </span>
                      <p className="text-xl font-bold font-inter text-[#25282D]">
                        ₹{card.current_balance.toLocaleString('en-IN')}
                      </p>
                      <span className="text-[10px] text-[#8792A2]">
                        Original: ₹{card.original_value.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/gift-card/${card.code}`}
                        className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-semibold text-[#343A40] flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#8792A2]" />
                        <span>View Card</span>
                      </Link>

                      {card.relationship === 'PURCHASED' && card.delivery_method === 'EMAIL' && (
                        <button
                          onClick={() => handleResend(card.id, card.recipient_email)}
                          disabled={resendingId === card.id}
                          className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-semibold text-[#343A40] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          <Send className={`w-3.5 h-3.5 text-[#8792A2] ${resendingId === card.id ? 'animate-spin' : ''}`} />
                          <span>Resend Email</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                        className="p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#8792A2] hover:text-[#25282D] transition-colors cursor-pointer shadow-xs"
                        title="Toggle Transaction Ledger"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Transaction Ledger & Detail Drawer */}
                {isExpanded && (
                  <div className="p-5 bg-[#F3F4F6]/50 border-t border-[#E5E7EB] space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase tracking-wider text-[#8792A2] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#25282D]" />
                        Transaction Ledger
                      </span>
                      <span className="text-[11px] text-[#8792A2]">
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
                            className="p-3 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                  tx.amount > 0
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {tx.amount > 0 ? (
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-[#25282D]">
                                  {tx.transaction_type}: {tx.reason || 'Balance update'}
                                </p>
                                <p className="text-[10px] text-[#8792A2]">
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
                              <p className="text-[10px] text-[#8792A2]">
                                Balance: ₹{tx.balance_after.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#8792A2] italic">
                        No transactions recorded on this gift card yet.
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

export default CustomerGiftCardsTab;
