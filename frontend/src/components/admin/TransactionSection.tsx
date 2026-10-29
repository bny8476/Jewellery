import React, { useState } from 'react';
import { Scale, FileText, Plus, DollarSign, XCircle, ArrowRightLeft, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PawnDashboardAndRegister } from './pawn/PawnDashboardAndRegister';
import PledgeEntryForm from './PledgeEntryForm';
import PartPaymentForm from './PartPaymentForm';
import PledgeReturnForm from './PledgeReturnForm';
import AdditionalPledgeForm from './AdditionalPledgeForm';
import PledgeSalesForm from './PledgeSalesForm';
import CancelTransactionForm from './CancelTransactionForm';
import { PawnRequest } from '../../lib/supabase';
import { EASINGS, TIMING } from '../../utils/motion';

type TransactionTab = 'register' | 'pledge_entry' | 'additional_pledge' | 'pledge_return' | 'part_payment' | 'pledge_sales' | 'cancel';

interface TransactionSectionProps {
    initialPawnRequest?: PawnRequest | null;
}

const TransactionSection: React.FC<TransactionSectionProps> = ({ initialPawnRequest }) => {
    const [activeTab, setActiveTab] = useState<TransactionTab>(initialPawnRequest ? 'pledge_entry' : 'register');
    const [refreshKey, setRefreshKey] = useState(0);

    const tabs = [
        { id: 'register' as TransactionTab, label: 'Pawn Register & Metrics', icon: Scale },
        { id: 'pledge_entry' as TransactionTab, label: 'New Pledge Entry', icon: Plus },
        { id: 'part_payment' as TransactionTab, label: 'Part Payment & Interest', icon: DollarSign },
        { id: 'pledge_return' as TransactionTab, label: 'Pledge Return / Redemption', icon: ArrowRightLeft },
        { id: 'additional_pledge' as TransactionTab, label: 'Additional Pledge', icon: FileText },
        { id: 'pledge_sales' as TransactionTab, label: 'Auction & Forfeiture', icon: ShoppingBag },
        { id: 'cancel' as TransactionTab, label: 'Cancel Record', icon: XCircle },
    ];

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
        setActiveTab('register');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[26px] font-semibold text-[var(--text-main)] tracking-tight admin-page-heading">Pawn Transactions &amp; Ledger</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Lending disbursements, collateral redemptions, interim interest collections, and forfeited auction records.</p>
            </div>

            {/* Sub Tabs */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-1.5 shadow-sm">
                <div className="flex flex-wrap gap-1.5">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-colors cursor-pointer ${
                                    isActive
                                        ? 'text-black'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTransactionTabPill"
                                        className="absolute inset-0 bg-[var(--gold-primary)] rounded-lg shadow-sm"
                                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center space-x-2">
                                    <Icon className="h-4 w-4" />
                                    <span>{tab.label}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Workspace */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${activeTab}-${refreshKey}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: TIMING.standard, ease: EASINGS.luxury }}
                    >
                        {activeTab === 'register' && (
                            <PawnDashboardAndRegister
                                key={`register-${refreshKey}`}
                                onNewPawnLoan={() => setActiveTab('pledge_entry')}
                            />
                        )}

                        {activeTab === 'pledge_entry' && (
                            <PledgeEntryForm
                                key={refreshKey}
                                onSuccess={handleSuccess}
                                initialPawnRequest={initialPawnRequest}
                            />
                        )}

                        {activeTab === 'additional_pledge' && (
                            <AdditionalPledgeForm
                                key={`additional-${refreshKey}`}
                                onSuccess={handleSuccess}
                            />
                        )}

                        {activeTab === 'pledge_return' && (
                            <PledgeReturnForm
                                key={`return-${refreshKey}`}
                                onSuccess={handleSuccess}
                            />
                        )}

                        {activeTab === 'part_payment' && (
                            <PartPaymentForm
                                key={`partpayment-${refreshKey}`}
                                onSuccess={handleSuccess}
                            />
                        )}

                        {activeTab === 'pledge_sales' && (
                            <PledgeSalesForm
                                key={`sales-${refreshKey}`}
                                onSuccess={handleSuccess}
                            />
                        )}

                        {activeTab === 'cancel' && (
                            <CancelTransactionForm
                                key={`cancel-${refreshKey}`}
                                onSuccess={handleSuccess}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TransactionSection;
