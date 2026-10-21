import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Edit2, Save, X, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCurrentMetalRates, updateMetalRate } from '../../services/masterService';
import { useRates } from '../../context/RateContext';
import { toast } from '../../utils/toast';

interface MetalRateWidgetProps {
    onRatesUpdated?: () => void;
    compact?: boolean;
}

const MetalRateWidget: React.FC<MetalRateWidgetProps> = ({ onRatesUpdated, compact = false }) => {
    const { t } = useTranslation();
    const { rates: liveRates, refreshRates: fetchMarketRates } = useRates();
    const [goldRate, setGoldRate] = useState(0);
    const [silverRate, setSilverRate] = useState(0);
    const [editingRates, setEditingRates] = useState(false);
    const [tempGoldRate, setTempGoldRate] = useState(0);
    const [tempSilverRate, setTempSilverRate] = useState(0);
    const [loading, setLoading] = useState(true);
    const [fetchingMarket, setFetchingMarket] = useState(false);

    useEffect(() => {
        loadRates();
    }, []);

    // Sync state when live rates change
    useEffect(() => {
        if (liveRates.gold > 0) {
            setGoldRate(liveRates.gold);
            if (!editingRates) setTempGoldRate(liveRates.gold);
        }
        if (liveRates.silver > 0) {
            setSilverRate(liveRates.silver);
            if (!editingRates) setTempSilverRate(liveRates.silver);
        }
    }, [liveRates.gold, liveRates.silver, editingRates]);

    const loadRates = async () => {
        try {
            setLoading(true);
            const rates = await getCurrentMetalRates();
            const resolvedGold = rates.gold > 0 ? rates.gold : liveRates.gold;
            const resolvedSilver = rates.silver > 0 ? rates.silver : liveRates.silver;
            setGoldRate(resolvedGold);
            setSilverRate(resolvedSilver);
            setTempGoldRate(resolvedGold);
            setTempSilverRate(resolvedSilver);
        } catch (error) {
            console.error('Error loading rates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchMarket = async () => {
        try {
            setFetchingMarket(true);
            await fetchMarketRates();
            toast.success('Live market spot rates synced from GoldAPI.io');
            if (onRatesUpdated) onRatesUpdated();
        } catch {
            toast.error('Could not fetch market rates from GoldAPI.io');
        } finally {
            setFetchingMarket(false);
        }
    };

    const handleSaveRates = async () => {
        try {
            await Promise.all([
                updateMetalRate('gold', tempGoldRate),
                updateMetalRate('silver', tempSilverRate)
            ]);
            setGoldRate(tempGoldRate);
            setSilverRate(tempSilverRate);
            setEditingRates(false);
            if (onRatesUpdated) onRatesUpdated();
            toast.success(t('messages.ratesUpdated'));
        } catch (error) {
            console.error('Error updating rates:', error);
            toast.error(t('messages.ratesUpdateFailed'));
        }
    };

    if (loading) {
        return compact ? (
            <div className="animate-pulse h-8 w-48 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)]"></div>
        ) : (
            <div className="animate-pulse h-10 w-48 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)]"></div>
        );
    }

    const gold22kRate = liveRates.gold22k || Math.round(goldRate * 0.916);
    const formatSilver = (rate: number) => {
        if (!rate || isNaN(rate)) return '0.00';
        return rate.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };
    const formatGold = (rate: number) => {
        if (!rate || isNaN(rate)) return '0';
        return rate.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    };

    if (compact) {
        return (
            <div className="h-9 flex items-center gap-2 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs shadow-xs shrink-0 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-[var(--gold-primary)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Real-Time GoldAPI.io Sync" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--gold-primary)]">Gold:</span>
                    <span className="font-mono font-bold text-[var(--text-main)] text-xs">₹{formatGold(goldRate)}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">/g</span>
                </div>
                <span className="text-[var(--text-muted)] opacity-40">|</span>
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">Silver:</span>
                    <span className="font-mono font-bold text-[var(--text-main)] text-xs">₹{formatSilver(silverRate)}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">/g</span>
                </div>
                <button
                    onClick={handleFetchMarket}
                    disabled={fetchingMarket}
                    title="Sync spot rates from GoldAPI.io"
                    className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-amber-400 transition-colors ml-0.5"
                >
                    <RefreshCw className={`w-3 h-3 ${fetchingMarket ? 'animate-spin text-amber-400' : ''}`} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-4">
            {/* 24K Gold Card */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-700 text-white px-5 py-2.5 rounded-xl shadow-md border border-amber-400/30">
                <div className="flex items-center space-x-2.5">
                    <TrendingUp className="h-5 w-5 text-amber-200" />
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="text-[10px] uppercase tracking-wider font-semibold opacity-90">Gold 24K</p>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Real-Time GoldAPI.io" />
                        </div>
                        {editingRates ? (
                            <input
                                type="number"
                                value={tempGoldRate}
                                onChange={(e) => setTempGoldRate(Number(e.target.value))}
                                className="w-24 bg-white text-gray-900 px-2 py-0.5 rounded text-sm font-bold mt-0.5"
                            />
                        ) : (
                            <p className="text-base font-bold">₹{formatGold(goldRate)}<span className="text-xs font-normal opacity-85">/g</span></p>
                        )}
                    </div>
                </div>
            </div>

            {/* 22K Hallmarked Gold Badge */}
            <div className="bg-gradient-to-r from-yellow-600 to-amber-800 text-white px-4 py-2.5 rounded-xl shadow-md border border-yellow-500/30 hidden sm:block">
                <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold opacity-90">Gold 22K (916)</p>
                    <p className="text-base font-bold">₹{formatGold(gold22kRate)}<span className="text-xs font-normal opacity-85">/g</span></p>
                </div>
            </div>

            {/* Silver Card */}
            <div className="bg-gradient-to-r from-slate-500 to-slate-700 text-white px-5 py-2.5 rounded-xl shadow-md border border-slate-400/30">
                <div className="flex items-center space-x-2.5">
                    <TrendingDown className="h-5 w-5 text-slate-200" />
                    <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold opacity-90">{t('admin.silverRate')}</p>
                        {editingRates ? (
                            <input
                                type="number"
                                value={tempSilverRate}
                                onChange={(e) => setTempSilverRate(Number(e.target.value))}
                                className="w-24 bg-white text-gray-900 px-2 py-0.5 rounded text-sm font-bold mt-0.5"
                            />
                        ) : (
                            <p className="text-base font-bold">₹{formatSilver(silverRate)}<span className="text-xs font-normal opacity-85">/g</span></p>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            {editingRates ? (
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={handleFetchMarket}
                        disabled={fetchingMarket}
                        className="bg-amber-600 text-white px-3 py-2 rounded-lg hover:bg-amber-700 flex items-center space-x-1 text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                        title="Fetch live market rates from GoldAPI.io"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${fetchingMarket ? 'animate-spin' : ''}`} />
                        <span>Sync GoldAPI</span>
                    </button>
                    <button
                        onClick={handleSaveRates}
                        className="bg-emerald-600 text-white px-3.5 py-2 rounded-lg hover:bg-emerald-700 flex items-center space-x-1.5 text-xs font-semibold shadow-sm cursor-pointer"
                    >
                        <Save className="h-3.5 w-3.5" />
                        <span>Save</span>
                    </button>
                    <button
                        onClick={() => {
                            setEditingRates(false);
                            setTempGoldRate(goldRate);
                            setTempSilverRate(silverRate);
                        }}
                        className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 cursor-pointer"
                        aria-label="Cancel editing"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={handleFetchMarket}
                        disabled={fetchingMarket}
                        className="bg-amber-600/90 text-white px-3 py-2 rounded-lg hover:bg-amber-600 flex items-center space-x-1.5 text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                        title="Fetch real-time spot rates from GoldAPI.io"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${fetchingMarket ? 'animate-spin' : ''}`} />
                        <span>{fetchingMarket ? 'Syncing...' : 'Live Sync'}</span>
                    </button>
                    <button
                        onClick={() => setEditingRates(true)}
                        className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-1.5 text-xs font-semibold shadow-sm cursor-pointer transition-colors"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>{t('admin.editRates')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default MetalRateWidget;
