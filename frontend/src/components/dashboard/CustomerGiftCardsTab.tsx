import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { pdpAccordionVariants, cardEntranceVariants } from '../../utils/motion';

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E7EB] dark:border-[#222733] pb-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
            Gift Cards &amp; Certificates
          </h1>
          <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] mt-0.5">
            Manage purchased gift cards, track active balances, and review redemption history
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCards}
            disabled={loading}
            className="p-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#222733] bg-white dark:bg-[#181B22] text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:border-[#25282D] dark:hover:border-[#C9A45C] transition-colors cursor-pointer shadow-xs"
            title="Refresh Balances"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#25282D] dark:text-[#D8B878]' : ''}`} />
          </button>
          <Link
            to="/gift-cards"
            className="px-4 py-2.5 bg-[#25282D] hover:bg-black dark:bg-[#1C2029] dark:hover:bg-[#252A36] text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2 dark:border dark:border-[#C9A45C]/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Buy Gift Card</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#13151A] border border-[#E5E7EB] dark:border-[#222733] shadow-xs space-y-1 transition-colors">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8792A2] dark:text-[#8D96A5]">
            Available Balance
          </span>
          <p className="text-2xl sm:text-3xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
            ₹{totalAvailableBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Ready for checkout redemption</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#13151A] border border-[#E5E7EB] dark:border-[#222733] shadow-xs space-y-1 transition-colors">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8792A2] dark:text-[#8D96A5]">
            Active Cards
          </span>
          <p className="text-2xl sm:text-3xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
            {allCards.filter(c => c.status === 'ACTIVE' || c.status === 'PARTIALLY_REDEEMED').length}
          </p>
          <p className="text-[10px] text-[#8792A2] dark:text-[#8D96A5]">{allCards.length} total cards issued / received</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#13151A] border border-[#E5E7EB] dark:border-[#222733] shadow-xs space-y-1 transition-colors">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8792A2] dark:text-[#8D96A5]">
            Total Redeemed Value
          </span>
          <p className="text-2xl sm:text-3xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
            ₹{totalRedeemedValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-[#8792A2] dark:text-[#8D96A5]">Applied toward jewellery purchases</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] dark:border-[#222733] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-[#25282D] dark:bg-[#1C2029] text-white shadow-xs dark:border dark:border-[#C9A45C]/40'
              : 'text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA]'
          }`}
        >
          All Cards ({allCards.length})
        </button>
        <button
          onClick={() => setActiveFilter('PURCHASED')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeFilter === 'PURCHASED'
              ? 'bg-[#25282D] dark:bg-[#1C2029] text-white shadow-xs dark:border dark:border-[#C9A45C]/40'
              : 'text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA]'
          }`}
        >
          Purchased ({purchasedCards.length})
        </button>
        <button
          onClick={() => setActiveFilter('RECEIVED')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeFilter === 'RECEIVED'
              ? 'bg-[#25282D] dark:bg-[#1C2029] text-white shadow-xs dark:border dark:border-[#C9A45C]/40'
              : 'text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA]'
          }`}
        >
          Received ({receivedCards.length})
        </button>
      </div>

      {/* Gift Cards List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#25282D] dark:border-[#D8B878] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-wider text-[#8792A2] dark:text-[#8D96A5] font-semibold">Loading Gift Cards...</p>
        </div>
      ) : displayedCards.length === 0 ? (
        <div className="py-16 px-4 bg-white dark:bg-[#13151A] rounded-xl border border-[#E5E7EB] dark:border-[#222733] text-center space-y-4 transition-colors">
          <div className="w-14 h-14 rounded-full bg-[#F3F4F6] dark:bg-[#181B22] text-[#8792A2] dark:text-[#8D96A5] flex items-center justify-center mx-auto">
            <Gift className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">No Gift Cards Found</h3>
          <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] max-w-md mx-auto">
            {activeFilter === 'RECEIVED'
              ? 'You have not yet received any gift cards under this email address. When someone gifts you a YAZHINI card, it will automatically appear here.'
              : 'Present your family and friends with an authentic YAZHINI fine jewellery gift card.'}
          </p>
          <Link
            to="/gift-cards"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25282D] hover:bg-black dark:bg-[#1C2029] dark:hover:bg-[#252A36] text-white font-semibold text-xs rounded-lg shadow-xs transition-colors dark:border dark:border-[#C9A45C]/40"
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
              <motion.div
                key={card.id}
                variants={cardEntranceVariants}
                initial="initial"
                animate="animate"
                className="bg-white dark:bg-[#13151A] rounded-xl border border-[#E5E7EB] dark:border-[#222733] shadow-xs overflow-hidden hover:border-[#25282D] dark:hover:border-[#C9A45C] transition-all"
              >
                {/* Main Card Header Bar */}
                <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    {/* Visual Miniature Card Art */}
                    <div
                      className="w-14 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-[8px] font-inter font-bold uppercase tracking-wider shadow-xs border border-[#25282D] dark:border-[#C9A45C]/50 bg-[#25282D] dark:bg-[#181B22] relative overflow-hidden"
                    >
                      <span className="text-[#C9A45C] tracking-widest">YAZHINI</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-[#25282D] dark:text-[#F7F8FA] tracking-wider">
                          {card.code}
                        </span>
                        <button
                          onClick={() => handleCopy(card.code)}
                          className="p-1 rounded text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] transition-colors cursor-pointer"
                          title="Copy Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            card.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                              : card.status === 'PARTIALLY_REDEEMED'
                              ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/40'
                              : card.status === 'FULLY_REDEEMED'
                              ? 'bg-stone-100 dark:bg-[#1E2128] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                          }`}
                        >
                          {card.status.replace('_', ' ')}
                        </span>
                        {card.pin && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F3F4F6] dark:bg-[#181B22] text-[#8792A2] dark:text-[#8D96A5] border border-[#E5E7EB] dark:border-[#222733]">
                            PIN: <strong className="text-[#25282D] dark:text-[#F7F8FA]">{card.pin}</strong>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] mt-0.5">
                        {card.relationship === 'PURCHASED'
                          ? `Gifted to ${card.recipient_name} (${card.recipient_email})`
                          : `Received from ${card.purchaser_name || 'Valued Patron'}`}
                      </p>
                    </div>
                  </div>

                  {/* Financials & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider font-mono block">
                        Available Balance
                      </span>
                      <p className="text-xl font-bold font-inter text-[#25282D] dark:text-[#F7F8FA]">
                        ₹{card.current_balance.toLocaleString('en-IN')}
                      </p>
                      <span className="text-[10px] text-[#8792A2] dark:text-[#8D96A5]">
                        Original: ₹{card.original_value.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/gift-card/${card.code}`}
                        className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#181B22] hover:bg-[#F3F4F6] dark:hover:bg-[#202530] border border-[#E5E7EB] dark:border-[#222733] text-xs font-semibold text-[#343A40] dark:text-[#D2D7E2] flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#8792A2] dark:text-[#8D96A5]" />
                        <span>View Card</span>
                      </Link>

                      {card.relationship === 'PURCHASED' && card.delivery_method === 'EMAIL' && (
                        <button
                          onClick={() => handleResend(card.id, card.recipient_email)}
                          disabled={resendingId === card.id}
                          className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#181B22] hover:bg-[#F3F4F6] dark:hover:bg-[#202530] border border-[#E5E7EB] dark:border-[#222733] text-xs font-semibold text-[#343A40] dark:text-[#D2D7E2] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          <Send className={`w-3.5 h-3.5 text-[#8792A2] dark:text-[#8D96A5] ${resendingId === card.id ? 'animate-spin' : ''}`} />
                          <span>Resend Email</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                        className="p-2 rounded-lg border border-[#E5E7EB] dark:border-[#222733] bg-white dark:bg-[#181B22] text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] transition-colors cursor-pointer shadow-xs"
                        title="Toggle Transaction Ledger"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Transaction Ledger & Detail Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      variants={pdpAccordionVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="p-5 bg-[#F3F4F6]/50 dark:bg-[#181B22]/50 border-t border-[#E5E7EB] dark:border-[#222733] space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold uppercase tracking-wider text-[#8792A2] dark:text-[#8D96A5] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#25282D] dark:text-[#D8B878]" />
                          Transaction Ledger
                        </span>
                        <span className="text-[11px] text-[#8792A2] dark:text-[#8D96A5]">
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
                              className="p-3 rounded-lg bg-white dark:bg-[#13151A] border border-[#E5E7EB] dark:border-[#222733] flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                    tx.amount > 0
                                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                                      : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                                  }`}
                                >
                                  {tx.amount > 0 ? (
                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                  ) : (
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-[#25282D] dark:text-[#F7F8FA]">
                                    {tx.transaction_type}: {tx.reason || 'Balance update'}
                                  </p>
                                  <p className="text-[10px] text-[#8792A2] dark:text-[#8D96A5]">
                                    {tx.order_number ? `Order: ${tx.order_number} • ` : ''}
                                    {new Date(tx.created_at).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span
                                  className={`font-mono font-bold ${
                                    tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {tx.amount > 0 ? `+₹${tx.amount.toLocaleString('en-IN')}` : `-₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                                </span>
                                <p className="text-[10px] text-[#8792A2] dark:text-[#8D96A5]">
                                  Balance: ₹{tx.balance_after.toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] italic">
                          No transactions recorded on this gift card yet.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomerGiftCardsTab;
