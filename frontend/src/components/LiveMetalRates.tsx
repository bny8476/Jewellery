import React from 'react';
import { Link } from 'react-router-dom';
import { useRates } from '../context/RateContext';
import { TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrencyINR } from '../utils/formatters';

const LiveMetalRates: React.FC = () => {
    const { rates, loading, lastUpdated, isLive, refreshRates } = useRates();

    const handleRefresh = async () => {
        if (loading) return;
        await refreshRates();
    };

    const formatPrice = (price: number) => {
        return formatCurrencyINR(price, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatTime = (date: Date | null) => {
        if (!date) return 'Updating...';
        const isToday = new Date().toDateString() === date.toDateString();
        const timeStr = date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        return isToday ? `Today, ${timeStr}` : `${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}, ${timeStr}`;
    };

    return (
        <motion.div
            className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] overflow-x-auto shadow-sm transition-colors duration-200"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container mx-auto px-4 py-3 flex items-center gap-6 whitespace-nowrap min-w-max">
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    title="Click to refresh real-time metal rates"
                    className="flex items-center gap-2 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-1.5 rounded-full border border-amber-500/30 transition-all text-left group"
                >
                    <TrendingUp className="h-4 w-4 text-[var(--gold-primary)] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase text-[var(--gold-primary)] tracking-wider">
                        {isLive ? 'Daily Live Rates' : 'Daily Rates'}
                    </span>
                    <motion.div
                        animate={loading ? { rotate: 360 } : {}}
                        transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
                    >
                        <RefreshCw className="h-3 w-3 text-[var(--gold-primary)]/70 group-hover:text-[var(--gold-primary)]" />
                    </motion.div>
                </button>

                <div className="flex items-center gap-4 text-sm font-medium">
                    <motion.div
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/30 shadow-sm"
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <motion.div
                            className="w-2 h-2 rounded-full bg-amber-500"
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [1, 0.7, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-[var(--text-secondary)] font-inter">Gold 24K:</span>
                        <motion.span
                            className="text-[var(--gold-primary)] font-bold"
                            key={rates.gold}
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {formatPrice(rates.gold)}
                        </motion.span>
                        <span className="text-[10px] text-[var(--text-secondary)]">/g</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/5 rounded-full border border-amber-500/20 shadow-sm"
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <span className="text-[var(--text-secondary)] font-inter">Gold 22K:</span>
                        <motion.span
                            className="text-[var(--gold-primary)] font-bold"
                            key={rates.gold22k}
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {formatPrice(rates.gold22k)}
                        </motion.span>
                        <span className="text-[10px] text-[var(--text-secondary)]">/g</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-elevated)] rounded-full border border-[var(--border-color)] shadow-sm"
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <span className="text-[var(--text-secondary)] font-inter">Silver:</span>
                        <motion.span
                            className="text-[var(--text-main)] font-bold"
                            key={rates.silver}
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {formatPrice(rates.silver)}
                        </motion.span>
                        <span className="text-[10px] text-[var(--text-secondary)]">/g</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-elevated)] rounded-full border border-[var(--border-color)] shadow-sm"
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <span className="text-[var(--text-secondary)] font-inter">Platinum:</span>
                        <motion.span
                            className="text-[var(--text-main)] font-bold"
                            key={rates.platinum}
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {formatPrice(rates.platinum)}
                        </motion.span>
                        <span className="text-[10px] text-[var(--text-secondary)]">/g</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-elevated)] rounded-full border border-[var(--border-color)] shadow-sm"
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <span className="text-[var(--text-secondary)] font-inter">Diamond:</span>
                        <motion.span
                            className="text-[var(--text-main)] font-bold"
                            key={rates.diamond}
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {formatPrice(rates.diamond)}
                        </motion.span>
                        <span className="text-[10px] text-[var(--text-secondary)]">/ct</span>
                    </motion.div>
                </div>

                {/* Last Updated Indicator & Full Hub Link */}
                <div className="ml-auto flex items-center gap-3">
                    {lastUpdated && (
                        <motion.div
                            className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-3 py-1.5 rounded-full border border-[var(--border-color)]"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className="font-inter">Updated:</span>
                            <span className="font-bold text-[var(--gold-primary)]">{formatTime(lastUpdated)}</span>
                        </motion.div>
                    )}

                    <Link
                        to="/live-rates"
                        className="flex items-center gap-1.5 text-xs font-semibold text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 hover:bg-[var(--gold-primary)]/20 px-3 py-1.5 rounded-full border border-[var(--gold-primary)]/30 transition-all shadow-xs"
                    >
                        <span>Full Rates Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default LiveMetalRates;
