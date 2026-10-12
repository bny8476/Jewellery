import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentMetalRates, updateMetalRate } from '../services/masterService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type MetalRates = {
    gold: number;     // per gram (24K)
    gold22k: number;  // per gram (22K)
    silver: number;   // per gram
    platinum: number; // per gram
    diamond: number;  // per carat (simplified)
};

type RateContextType = {
    rates: MetalRates;
    loading: boolean;
    lastUpdated: Date | null;
    error: string | null;
    isLive: boolean;
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
    gold: 7450.00,    // ₹7,450 per gram for 24K Gold
    gold22k: 6824.00, // ₹6,824 per gram for 22K Gold (91.6% purity)
    silver: 94.50,    // ₹94.50 per gram for Silver
    platinum: 3450.00,// ₹3,450 per gram for Platinum
    diamond: 68000.00 // ₹68,000 per carat for Diamond
};

const CACHE_KEY = 'daily_metal_rates_cache';

interface CachedRates {
    rates: MetalRates;
    date: string; // YYYY-MM-DD
    timestamp: number;
    isLive: boolean;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const loadCachedRates = (): CachedRates | null => {
    try {
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

const saveCachedRates = (rates: MetalRates, isLive: boolean) => {
    try {
        const cachePayload: CachedRates = {
            rates,
            date: getTodayDateString(),
            timestamp: Date.now(),
            isLive
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
    } catch (e) {
        console.warn('Failed to save metal rates to localStorage:', e);
    }
};

export const RateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const initialCache = loadCachedRates();
    const [rates, setRates] = useState<MetalRates>(initialCache?.rates || DEFAULT_RATES);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(
        initialCache?.timestamp ? new Date(initialCache.timestamp) : null
    );
    const [isLive, setIsLive] = useState<boolean>(initialCache?.isLive ?? false);
    const [error, setError] = useState<string | null>(null);

    const fetchLiveRates = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const API_KEY = import.meta.env.VITE_GOLD_API_KEY || '';

            // 1. Try Live API if API Key is configured
            if (API_KEY) {
                try {
                    const goldResponse = await fetch('https://www.goldapi.io/api/XAU/INR', {
                        method: 'GET',
                        headers: {
                            'x-access-token': API_KEY,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (goldResponse.ok) {
                        const goldData = await goldResponse.json();
                        const GRAMS_PER_TROY_OUNCE = 31.1035;
                        const gold24k = goldData.price_gram_24k || (goldData.price / GRAMS_PER_TROY_OUNCE);
                        const gold22k = goldData.price_gram_22k || (gold24k * 0.916);

                        let silver = rates.silver;
                        try {
                            const silverResponse = await fetch('https://www.goldapi.io/api/XAG/INR', {
                                method: 'GET',
                                headers: {
                                    'x-access-token': API_KEY,
                                    'Content-Type': 'application/json'
                                }
                            });
                            if (silverResponse.ok) {
                                const silverData = await silverResponse.json();
                                silver = silverData.price_gram_24k || (silverData.price / GRAMS_PER_TROY_OUNCE);
                            }
                        } catch (silverErr) {
                            console.warn('Could not fetch silver live price, keeping existing:', silverErr);
                        }

                        const liveRates: MetalRates = {
                            gold: Math.round(gold24k * 100) / 100,
                            gold22k: Math.round(gold22k * 100) / 100,
                            silver: Math.round(silver * 100) / 100,
                            platinum: rates.platinum,
                            diamond: rates.diamond
                        };

                        setRates(liveRates);
                        setIsLive(true);
                        setLastUpdated(new Date());
                        saveCachedRates(liveRates, true);

                        // Persist to Supabase metal_rates table in the background
                        try {
                            await Promise.all([
                                updateMetalRate('gold', liveRates.gold),
                                updateMetalRate('silver', liveRates.silver)
                            ]);
                        } catch {
                            // Non-blocking if offline/unauthorized
                        }

                        console.log('✅ Real-time rates fetched from GoldAPI:', liveRates);
                        return;
                    }
                } catch (apiErr) {
                    console.warn('GoldAPI request failed, falling back to database/cache:', apiErr);
                }
            }

            // 2. Try fetching from Supabase metal_rates table (database-backed daily rates) if configured
            if (isSupabaseConfigured) {
                try {
                    const dbRates = await getCurrentMetalRates();
                    if (dbRates && (dbRates.gold > 0 || dbRates.silver > 0)) {
                        const resolvedRates: MetalRates = {
                            gold: dbRates.gold || rates.gold || DEFAULT_RATES.gold,
                            gold22k: Math.round((dbRates.gold * 0.916 || rates.gold22k || DEFAULT_RATES.gold22k) * 100) / 100,
                            silver: dbRates.silver || rates.silver || DEFAULT_RATES.silver,
                            platinum: rates.platinum || DEFAULT_RATES.platinum,
                            diamond: rates.diamond || DEFAULT_RATES.diamond
                        };

                        setRates(resolvedRates);
                        setIsLive(true);
                        setLastUpdated(new Date());
                        saveCachedRates(resolvedRates, true);
                        console.log('✅ Rates loaded from Supabase database:', resolvedRates);
                        return;
                    }
                } catch (dbErr) {
                    console.warn('Supabase metal_rates lookup failed:', dbErr);
                }
            }

            // 3. Fallback: check cached rates from localStorage
            const cached = loadCachedRates();
            if (cached && cached.rates) {
                setRates(cached.rates);
                setIsLive(cached.isLive);
                setLastUpdated(new Date(cached.timestamp));
                return;
            }

            // 4. Default market rates
            setRates(DEFAULT_RATES);
            setLastUpdated(new Date());
            setIsLive(false);
            saveCachedRates(DEFAULT_RATES, false);

        } catch (err) {
            console.error('❌ Error fetching metal rates:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch rates');
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
        // Re-calculate 22K gold if 24k gold was updated and 22k wasn't explicitly given
        if (newRates.gold && !newRates.gold22k) {
            merged.gold22k = Math.round(newRates.gold * 0.916 * 100) / 100;
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

        return () => {
            isSubscribed = false;
            supabase.removeChannel(channel);
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
                loading,
                lastUpdated,
                error,
                isLive,
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
