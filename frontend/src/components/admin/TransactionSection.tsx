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
        { id: 'register' as TransactionTab, label: 'Pawn Register & Metrics', shortLabel: 'Pawn Register', icon: Scale },
        { id: 'pledge_entry' as TransactionTab, label: 'New Pledge Entry', shortLabel: 'New Pledge', icon: Plus },
        { id: 'part_payment' as TransactionTab, label: 'Part Payment & Interest', shortLabel: 'Part Payment', icon: DollarSign },
        { id: 'pledge_return' as TransactionTab, label: 'Pledge Return / Redemption', shortLabel: 'Pledge Return', icon: ArrowRightLeft },
        { id: 'additional_pledge' as TransactionTab, label: 'Additional Pledge', shortLabel: 'Addl Pledge', icon: FileText },
        { id: 'pledge_sales' as TransactionTab, label: 'Auction & Forfeiture', shortLabel: 'Auction & Sale', icon: ShoppingBag },
        { id: 'cancel' as TransactionTab, label: 'Cancel Record', shortLabel: 'Cancel Record', icon: XCircle },
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

            {/* Sub Tabs: 1-Row Grid with Equal Alignment */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-1.5 shadow-sm overflow-x-auto no-scrollbar">
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 w-full min-w-[760px]">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                title={tab.label}
                                className={`relative w-full flex items-center justify-center space-x-1 sm:space-x-1.5 px-1.5 sm:px-2 xl:px-3 py-2 rounded-lg text-[10.5px] xl:text-[11.5px] 2xl:text-xs font-semibold tracking-wide uppercase whitespace-nowrap transition-colors cursor-pointer select-none min-w-0 ${
                                    isActive
                                        ? 'text-black dark:text-[#110D08] font-bold'
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
                                <span className="relative z-10 flex items-center justify-center space-x-1 sm:space-x-1.5 w-full min-w-0">
                                    <Icon className="h-3.5 w-3.5 xl:h-4 xl:w-4 shrink-0" />
                                    <span className="truncate hidden 2xl:inline">{tab.label}</span>
                                    <span className="truncate 2xl:hidden">{tab.shortLabel}</span>
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
