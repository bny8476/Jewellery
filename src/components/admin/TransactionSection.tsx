import React, { useState } from 'react';
import { FileText, Plus, DollarSign, XCircle, ArrowRightLeft, ShoppingBag } from 'lucide-react';
import PledgeEntryForm from './PledgeEntryForm';
import PartPaymentForm from './PartPaymentForm';
import PledgeReturnForm from './PledgeReturnForm';
import AdditionalPledgeForm from './AdditionalPledgeForm';
import PledgeSalesForm from './PledgeSalesForm';
import CancelTransactionForm from './CancelTransactionForm';
import { PawnRequest } from '../../lib/supabase';

type TransactionTab = 'pledge_entry' | 'additional_pledge' | 'pledge_return' | 'part_payment' | 'pledge_sales' | 'cancel';

interface TransactionSectionProps {
    initialPawnRequest?: PawnRequest | null;
}

const TransactionSection: React.FC<TransactionSectionProps> = ({ initialPawnRequest }) => {
    const [activeTab, setActiveTab] = useState<TransactionTab>('pledge_entry');
    const [refreshKey, setRefreshKey] = useState(0);

    const tabs = [
        { id: 'pledge_entry' as TransactionTab, label: 'New Pledge Entry', icon: Plus },
        { id: 'additional_pledge' as TransactionTab, label: 'Additional Pledge', icon: FileText },
        { id: 'pledge_return' as TransactionTab, label: 'Pledge Return / Redemption', icon: ArrowRightLeft },
        { id: 'part_payment' as TransactionTab, label: 'Part Payment', icon: DollarSign },
        { id: 'pledge_sales' as TransactionTab, label: 'Pledge Auction / Sales', icon: ShoppingBag },
        { id: 'cancel' as TransactionTab, label: 'Cancel Record', icon: XCircle },
    ];

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-serif font-bold text-[var(--text-main)]">Pawn Transactions &amp; Ledger</h2>
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
                                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all ${
                                    isActive
                                        ? 'bg-[var(--gold-primary)] text-black shadow-sm'
                                        : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Workspace */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
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
            </div>
        </div>
    );
};

export default TransactionSection;
