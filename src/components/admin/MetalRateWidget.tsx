import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Edit2, Save, X, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCurrentMetalRates, updateMetalRate } from '../../services/masterService';
import { useRates } from '../../context/RateContext';
import { toast } from '../../utils/toast';

interface MetalRateWidgetProps {
    onRatesUpdated?: () => void;
}

const MetalRateWidget: React.FC<MetalRateWidgetProps> = ({ onRatesUpdated }) => {
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
            if (liveRates.gold > 0) setTempGoldRate(liveRates.gold);
            if (liveRates.silver > 0) setTempSilverRate(liveRates.silver);
            toast.info('Fetched current market rates');
        } catch {
            toast.error('Could not fetch market rates');
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

    if (loading) return <div className="animate-pulse h-10 w-48 bg-gray-200 rounded"></div>;

    return (
        <div className="flex items-center space-x-6">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-3 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <div>
                        <p className="text-xs opacity-90">Gold Rate</p>
                        {editingRates ? (
                            <input
                                type="number"
                                value={tempGoldRate}
                                onChange={(e) => setTempGoldRate(Number(e.target.value))}
                                className="w-24 bg-white text-gray-900 px-2 py-1 rounded text-sm font-bold"
                            />
                        ) : (
                            <p className="text-lg font-bold">₹{goldRate.toLocaleString()}/g</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-gray-400 to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5" />
                    <div>
                        <p className="text-xs opacity-90">{t('admin.silverRate')}</p>
                        {editingRates ? (
                            <input
                                type="number"
                                value={tempSilverRate}
                                onChange={(e) => setTempSilverRate(Number(e.target.value))}
                                className="w-24 bg-white text-gray-900 px-2 py-1 rounded text-sm font-bold"
                            />
                        ) : (
                            <p className="text-lg font-bold">₹{silverRate.toLocaleString()}/g</p>
                        )}
                    </div>
                </div>
            </div>

            {editingRates ? (
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={handleFetchMarket}
                        disabled={fetchingMarket}
                        className="bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-1 text-sm font-medium"
                        title="Fetch live market rates"
                    >
                        <RefreshCw className={`h-4 w-4 ${fetchingMarket ? 'animate-spin' : ''}`} />
                        <span>Live Rate</span>
                    </button>
                    <button
                        onClick={handleSaveRates}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                    </button>
                    <button
                        onClick={() => {
                            setEditingRates(false);
                            setTempGoldRate(goldRate);
                            setTempSilverRate(silverRate);
                        }}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setEditingRates(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                    <Edit2 className="h-4 w-4" />
                    <span>{t('admin.editRates')}</span>
                </button>
            )}
        </div>
    );
};

export default MetalRateWidget;
