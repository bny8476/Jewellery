import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentMetalRates, updateMetalRate } from '../services/masterService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { realtimeManager } from '../services/realtimeService';

export type MetalRates = {
    gold: number;     // per gram (24K 999.9) - ₹14,928
    gold22k: number;  // per gram (22K 916) - ₹13,684
    gold18k?: number; // per gram (18K) - ₹11,207
    silver: number;   // per gram - ₹181.20
    platinum: number; // per gram - ₹5,085
    diamond: number;  // per carat (simplified)
    sellBack24k?: number; // per gram (24K sell-back) - ₹14,523
};

export const DEFAULT_LIVE_24K_GOLD = 14928.00;
export const DEFAULT_LIVE_24K_SELL_BACK = 14522.00;
export const DEFAULT_LIVE_22K_GOLD = 13684.00;
export const DEFAULT_LIVE_SILVER = 173.00;

export interface MetalRateQuote {
    ratePerGram: number;
    ratePer10Gram?: number;
    ratePerKg?: number;
    change24h: number;
    changePercent24h: number;
    high24h?: number;
    low24h?: number;
    prevClose?: number;
}

export interface MetalRatesDetailed {
    gold: {
        k24: MetalRateQuote;
        k22: MetalRateQuote;
        k18: MetalRateQuote;
    };
    silver: MetalRateQuote;
    platinum: MetalRateQuote;
    retailEstimates?: {
        gold22kRetail: number;
        gold24kRetail: number;
        silverRetailPerKg: number;
        gstRatePercent: number;
        dutyNote: string;
    };
    metadata?: {
        timestamp: string;
        istTime: string;
        displayNotice?: string;
        effectiveDate?: string;
        updateSchedule?: string;
        source: string;
        isLive: boolean;
        cached: boolean;
        cacheAgeSeconds: number;
        stale: boolean;
        providerStatus: string;
    };
}

type RateContextType = {
    rates: MetalRates;
    detailedRates: MetalRatesDetailed | null;
    loading: boolean;
    lastUpdated: Date | null;
    istTime: string | null;
    error: string | null;
    isLive: boolean;
    isStale: boolean;
    refreshRates: () => Promise<void>;
    updateRatesManually: (newRates: Partial<MetalRates>) => Promise<void>;
    calculateProductPrice: (
        weight: number,
        metalType: string,
        wastagePercent: number,
        basePrice?: number,
        productName?: string
    ) => {
        basePrice: number;
        wastageAmount: number;
        cgst: number;
        sgst: number;
        totalPrice: number;
    };
};

const RateContext = createContext<RateContextType | undefined>(undefined);

// Market-aligned realistic fallback rates for India (per gram / carat in INR)
const DEFAULT_RATES: MetalRates = {
    gold: 14928.00,   // ₹14,928 per gram for 24K 999.9 Gold
    gold22k: 13684.00,// ₹13,684 per gram for 22K Gold (916 BIS Hallmark)
    gold18k: 11207.00,// ₹11,207 per gram for 18K Gold
    silver: 173.00,   // ₹173.00 per gram for Silver
    platinum: 5085.00,// ₹5,085 per gram for Platinum
    diamond: 68000.00,// ₹68,000 per carat for Diamond
    sellBack24k: 14522.00 // ₹14,522 per gram for 24K Sell-Back
};

const CACHE_KEY = 'daily_metal_rates_cache';

interface CachedRates {
    rates: MetalRates;
    date: string; // YYYY-MM-DD
    timestamp: number;
    isLive: boolean;
    detailed?: MetalRatesDetailed;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const loadCachedRates = (): CachedRates | null => {
    try {
        if (typeof window === 'undefined' || !window.localStorage || typeof window.localStorage.getItem !== 'function') {
            return null;
        }
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached) as CachedRates;
            return parsed;
        }
    } catch (e) {
        console.warn('Failed to read metal rates from localStorage:', e);
    }
    return null;
};

const saveCachedRates = (rates: MetalRates, isLive: boolean, detailed?: MetalRatesDetailed) => {
    try {
        if (typeof window === 'undefined' || !window.localStorage || typeof window.localStorage.setItem !== 'function') {
            return;
        }
        const cachePayload: CachedRates = {
            rates,
            date: getTodayDateString(),
            timestamp: Date.now(),
            isLive,
            detailed
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
    } catch (e) {
        console.warn('Failed to save metal rates to localStorage:', e);
    }
};

export const RateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const initialCache = loadCachedRates();
    const [rates, setRates] = useState<MetalRates>(initialCache?.rates || DEFAULT_RATES);
    const [detailedRates, setDetailedRates] = useState<MetalRatesDetailed | null>(initialCache?.detailed || null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(
        initialCache?.timestamp ? new Date(initialCache.timestamp) : null
    );
    const [istTime, setIstTime] = useState<string | null>(null);
    const [isLive, setIsLive] = useState<boolean>(initialCache?.isLive ?? false);
    const [isStale, setIsStale] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLiveRates = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Try internal backend API endpoint (/api/metal-rates)
            try {
                const apiRes = await fetch('/api/metal-rates', {
                    headers: { 'Accept': 'application/json' }
                });

                if (apiRes.ok) {
                    const data = await apiRes.json();
                    if (data && data.gold && data.silver) {
                        const rawGold = data.gold?.k24?.ratePerGram || DEFAULT_RATES.gold;
                        // Map to retail standard if raw international spot was returned
                        const resolvedGold = rawGold >= 14000 ? rawGold : (data.retailEstimates?.gold24kRetail && data.retailEstimates.gold24kRetail >= 14000 ? data.retailEstimates.gold24kRetail : Math.round(rawGold * 1.20652 * 100) / 100);
                        const resolvedGold22k = (data.gold?.k22?.ratePerGram && data.gold.k22.ratePerGram >= 12000) 
                            ? data.gold.k22.ratePerGram 
                            : (data.retailEstimates?.gold22kRetail && data.retailEstimates.gold22kRetail >= 12000)
                                ? data.retailEstimates.gold22kRetail
                                : Math.round(resolvedGold * 0.916666 * 100) / 100;
                        const resolvedGold18k = (data.gold?.k18?.ratePerGram && data.gold.k18.ratePerGram >= 10000)
                            ? data.gold.k18.ratePerGram
                            : Math.round(resolvedGold * 0.750 * 100) / 100;
                        const resolvedSilver = data.silver?.ratePerGram || DEFAULT_RATES.silver;
                        const resolvedSellBack = data.retailEstimates?.gold24kSellBack || Math.round(resolvedGold * 0.9728) || DEFAULT_RATES.sellBack24k;

                        const newRates: MetalRates = {
                            gold: resolvedGold,
                            gold22k: resolvedGold22k,
                            gold18k: resolvedGold18k,
                            silver: resolvedSilver,
                            platinum: data.platinum?.ratePerGram || rates.platinum || DEFAULT_RATES.platinum,
                            diamond: rates.diamond || DEFAULT_RATES.diamond,
                            sellBack24k: resolvedSellBack
                        };

                        setRates(newRates);
                        setDetailedRates(data);
                        setIsLive(true);
                        setIsStale(Boolean(data.metadata?.stale));
                        setLastUpdated(new Date(data.metadata?.timestamp || Date.now()));
                        setIstTime(data.metadata?.istTime || null);
                        saveCachedRates(newRates, true, data);

                        // Persist to Supabase if available
                        try {
                            await Promise.all([
                                updateMetalRate('gold', newRates.gold),
                                updateMetalRate('silver', newRates.silver)
                            ]);
                        } catch (err) {
                            void err;
                        }

                        return;
                    }
                }
            } catch (backendErr) {
                console.warn('Backend /api/metal-rates call failed, attempting database / offline cache:', backendErr);
            }

            // 2. Fallback: Database lookup
            if (isSupabaseConfigured) {
                try {
                    const dbRates = await getCurrentMetalRates();
                    if (dbRates && (dbRates.gold > 0 || dbRates.silver > 0)) {
                        const goldVal = dbRates.gold >= 14000 ? dbRates.gold : DEFAULT_RATES.gold;
                        const resolvedRates: MetalRates = {
                            gold: goldVal,
                            gold22k: Math.round(goldVal * 0.916666 * 100) / 100,
                            gold18k: Math.round(goldVal * 0.750 * 100) / 100,
                            silver: dbRates.silver || DEFAULT_RATES.silver,
                            platinum: rates.platinum || DEFAULT_RATES.platinum,
                            diamond: rates.diamond || DEFAULT_RATES.diamond,
                            sellBack24k: Math.round(goldVal * 0.9728)
                        };

                        setRates(resolvedRates);
                        setIsLive(true);
                        setLastUpdated(new Date());
                        saveCachedRates(resolvedRates, true);
                        return;
                    }
                } catch (dbErr) {
                    console.warn('Supabase metal_rates lookup failed:', dbErr);
                }
            }

            // 4. Fallback: LocalStorage cached rates
            const cached = loadCachedRates();
            if (cached && cached.rates) {
                setRates(cached.rates);
                setIsLive(cached.isLive);
                setIsStale(true);
                setLastUpdated(new Date(cached.timestamp));
                return;
            }

            // 5. Default market rates
            setRates(DEFAULT_RATES);
            setLastUpdated(new Date());
            setIsLive(false);
            setIsStale(true);
            saveCachedRates(DEFAULT_RATES, false);

        } catch (err) {
            console.error('❌ Error in RateProvider:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch rates');
            setIsStale(true);
        } finally {
            setLoading(false);
        }
    }, [rates]);

    // Manual update function (used by Admin or quick update)
    const updateRatesManually = async (newRates: Partial<MetalRates>) => {
        const merged: MetalRates = {
            ...rates,
            ...newRates
        };
        // Re-calculate 22K gold and sell-back if 24k gold was updated
        if (newRates.gold && !newRates.gold22k) {
            merged.gold22k = Math.round(newRates.gold * 0.916666 * 100) / 100;
        }
        if (newRates.gold && !newRates.sellBack24k) {
            merged.sellBack24k = Math.round(newRates.gold * 0.9728);
        }

        setRates(merged);
        setIsLive(true);
        setLastUpdated(new Date());
        saveCachedRates(merged, true);

        // Update database
        try {
            if (newRates.gold) await updateMetalRate('gold', merged.gold);
            if (newRates.silver) await updateMetalRate('silver', merged.silver);
        } catch (dbErr) {
            console.warn('Failed to persist updated rates to database:', dbErr);
        }
    };

    // Initial load
    useEffect(() => {
        fetchLiveRates();
    }, []);

    // Listen to Supabase Realtime changes on metal_rates if Supabase is configured
    useEffect(() => {
        if (!isSupabaseConfigured) {
            // Offline / unconfigured mode: realtime WebSocket disabled to prevent connection errors
            return;
        }

        let isSubscribed = true;

        const channel = supabase
            .channel('realtime_metal_rates_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'metal_rates' },
                (payload) => {
                    console.log('⚡ Realtime metal rate event received:', payload);
                    const record = payload.new as { metal_type?: string; rate_per_gram?: number };
                    if (record && record.metal_type && record.rate_per_gram) {
                        setRates(prev => {
                            const updated = { ...prev };
                            if (record.metal_type === 'gold') {
                                updated.gold = Number(record.rate_per_gram);
                                updated.gold22k = Math.round(Number(record.rate_per_gram) * 0.916 * 100) / 100;
                            } else if (record.metal_type === 'silver') {
                                updated.silver = Number(record.rate_per_gram);
                            }
                            setLastUpdated(new Date());
                            setIsLive(true);
                            saveCachedRates(updated, true);
                            return updated;
                        });
                    } else {
                        fetchLiveRates();
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    if (isSubscribed) {
                        console.warn(`Realtime connection (${status}). Unsubscribing to prevent reconnect loops.`);
                        supabase.removeChannel(channel);
                    }
                }
            });

        const unsubscribeSse = realtimeManager.subscribe('metal-rates.updated', () => {
            console.log('⚡ Received real-time metal rates update!');
            fetchLiveRates();
        });

        return () => {
            isSubscribed = false;
            supabase.removeChannel(channel);
            unsubscribeSse();
        };
    }, [fetchLiveRates]);

    // Daily auto-refresh & periodic check (checks date change every 60 seconds)
    useEffect(() => {
        let lastCheckedDate = getTodayDateString();

        const dailyCheckInterval = setInterval(() => {
            const currentDate = getTodayDateString();
            if (currentDate !== lastCheckedDate) {
                console.log('🌅 Date rolled over to new day! Refreshing daily metal rates...');
                lastCheckedDate = currentDate;
                fetchLiveRates();
            }
        }, 60000); // Check every minute

        // Periodic live refresh every 10 minutes
        const periodicRefresh = setInterval(() => {
            console.log('🔄 Periodic check for metal rate updates...');
            fetchLiveRates();
        }, 600000); // 10 minutes

        return () => {
            clearInterval(dailyCheckInterval);
            clearInterval(periodicRefresh);
        };
    }, [fetchLiveRates]);

    const calculateProductPrice = (
        weight: number,
        metalType: string,
        wastagePercent: number,
        basePrice: number = 0,
        productName: string = ''
    ) => {
        let metalRate = 0;

        switch ((metalType || '').toLowerCase()) {
            case 'gold':
                // Check if it's 24K (Coins) or 22K (Jewelry)
                metalRate = (productName || '').toLowerCase().includes('24k') ? rates.gold : rates.gold22k;
                break;
            case 'silver':
                metalRate = rates.silver;
                break;
            case 'platinum':
                metalRate = rates.platinum;
                break;
            case 'diamond':
                metalRate = rates.diamond;
                break;
            default:
                return {
                    basePrice: basePrice,
                    wastageAmount: 0,
                    cgst: basePrice * 0.015,
                    sgst: basePrice * 0.015,
                    totalPrice: basePrice * 1.03
                };
        }

        const metalValue = weight * metalRate;
        const wastageAmount = metalValue * (wastagePercent / 100);
        const subtotal = metalValue + wastageAmount;
        const cgst = subtotal * 0.015;
        const sgst = subtotal * 0.015;
        const total = subtotal + cgst + sgst;

        return {
            basePrice: metalValue,
            wastageAmount,
            cgst,
            sgst,
            totalPrice: total
        };
    };

    return (
        <RateContext.Provider
            value={{
                rates,
                detailedRates,
                loading,
                lastUpdated,
                istTime,
                error,
                isLive,
                isStale,
                refreshRates: fetchLiveRates,
                updateRatesManually,
                calculateProductPrice
            }}
        >
            {children}
        </RateContext.Provider>
    );
};

export const useRates = () => {
    const context = useContext(RateContext);
    if (!context) {
        throw new Error('useRates must be used within a RateProvider');
    }
    return context;
};
