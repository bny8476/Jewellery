import React, { useState } from 'react';
import { BarChart3, FileText, Download, Loader2, DollarSign, TrendingUp } from 'lucide-react';
import {
    getDayBookReport,
    getCustomerPledgeReport,
    getBankPledgeReport,
    getPledgeSalesReport,
    getInterestPendingReport,
    getInterestCollectionReport
} from '../../services/reportService';
import { toast } from '../../utils/toast';

const ReportsSection: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [activeReport, setActiveReport] = useState<string | null>(null);
    const [reportData, setReportData] = useState<any[]>([]);
    const [subTab, setSubTab] = useState<'new_pledge' | 'pledge_return' | 'in_bank' | 'non_return' | 'pledge_sales'>('new_pledge');

    // Default to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dateRange, setDateRange] = useState({
        start_date: firstDay.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0]
    });

    const reports = [
        { id: 'day_book', name: 'Detail Report (Day Book)', description: 'Daily Transactions & Cash Flow', icon: FileText },
        { id: 'interest_pending', name: 'Interest Pending', description: 'Due interest on active pledges', icon: TrendingUp },
        { id: 'interest_collection', name: 'Interest Collection', description: 'Interest collected history', icon: DollarSign },
        { id: 'bank_pledge', name: 'Bank Pledge Report', description: 'Items currently in bank', icon: FileText },
        { id: 'customer_pledge', name: 'Customer History', description: 'Customer-wise pledge summary', icon: BarChart3 },
        { id: 'pledge_sales', name: 'Unredeemed Sales', description: 'Sales report', icon: BarChart3 },
    ];

    const handleViewReport = async (reportId: string, overrideSubTab?: string) => {
        setLoading(true);
        setActiveReport(reportId);
        // Don't clear data immediately if switching subtabs to avoid flicker, or do if preferred.
        if (!overrideSubTab) setReportData([]);

        try {
            let data: any[] = [];
            const currentSubTab = overrideSubTab || subTab;

            switch (reportId) {
                case 'day_book':
                    data = await getDayBookReport(dateRange);
                    break;
                case 'interest_pending':
                    data = await getInterestPendingReport(dateRange);
                    break;
                case 'interest_collection':
                    data = await getInterestCollectionReport(dateRange);
                    break;
                case 'customer_pledge':
                    // Pass the subTab (either from state or override)
                    data = await getCustomerPledgeReport(dateRange, currentSubTab);
                    break;
                case 'bank_pledge':
                    data = await getBankPledgeReport(dateRange);
                    break;
                case 'pledge_sales':
                    data = await getPledgeSalesReport(dateRange);
                    break;
            }
            setReportData(data);
            if (data.length === 0) {
                toast.info('No records found for the selected period');
            }
        } catch (error: any) {
            console.error('Error fetching report:', error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleSubTabChange = (newTab: any) => {
        setSubTab(newTab);
        handleViewReport('customer_pledge', newTab);
    };

    const handleExport = () => {
        if (reportData.length === 0) {
            toast.error('No data to export');
            return;
        }

        // Simple CSV Export
        const headers = Object.keys(reportData[0]);
        const csvContent = [
            headers.join(','),
            ...reportData.map((row: any) => headers.map(fieldName => {
                const value = row[fieldName];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${activeReport}_report_${dateRange.start_date}_to_${dateRange.end_date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[26px] font-semibold text-[var(--text-main)] tracking-tight admin-page-heading">Financial &amp; Operations Reports</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Comprehensive audit reports for customer pledges, day-book ledgers, inventory, and loan portfolios</p>
            </div>

            {/* Date Range Filter */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6">
                <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4">Select Date Range</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">From Date</label>
                        <input
                            type="date"
                            value={dateRange.start_date}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--gold-primary)]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">To Date</label>
                        <input
                            type="date"
                            value={dateRange.end_date}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--gold-primary)]"
                        />
                    </div>
                    <div className="flex items-end">
                        <div className="w-full p-2.5 bg-[var(--bg-elevated)] rounded-xl text-xs text-[var(--text-secondary)] border border-[var(--border-color)]">
                            Filtered date window for financial ledger queries
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map((report) => {
                    const Icon = report.icon;
                    const isActive = activeReport === report.id;
                    return (
                        <div key={report.id} className={`bg-[var(--bg-card)] rounded-2xl border transition-all p-6 shadow-sm ${isActive ? 'border-[var(--gold-primary)] ring-1 ring-[var(--gold-primary)]' : 'border-[var(--border-color)] hover:border-[var(--gold-primary)]/50'}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 p-3 rounded-xl">
                                        <Icon className="h-6 w-6 text-[var(--gold-primary)]" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-[var(--text-main)]">{report.name}</h3>
                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{report.description}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleViewReport(report.id)}
                                    disabled={loading}
                                    className="flex-1 bg-[var(--gold-primary)] text-black px-4 py-2.5 rounded-xl font-semibold text-xs hover:opacity-90 flex items-center justify-center space-x-2 disabled:opacity-50 transition-opacity"
                                >
                                    {loading && activeReport === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                                    <span>Run Analytics Report</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sub-tabs for Customer History Report */}
            {activeReport === 'customer_pledge' && (
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-1.5 shadow-sm">
                    <div className="flex space-x-1.5 overflow-x-auto p-1">
                        {[
                            { id: 'new_pledge', label: 'New Pledge' },
                            { id: 'pledge_return', label: 'Return Pledge' },
                            { id: 'in_bank', label: 'In Bank Pledge' },
                            { id: 'non_return', label: 'Non Return' },
                            { id: 'pledge_sales', label: 'Pledge Sales' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleSubTabChange(tab.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${subTab === tab.id
                                        ? 'bg-[var(--gold-primary)] text-black font-bold'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Table */}
            {activeReport && reportData.length > 0 && (
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]">
                        <h3 className="font-bold text-sm text-[var(--text-main)]">
                            Results ({reportData.length} records generated)
                        </h3>
                        <button
                            onClick={handleExport}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-sm"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--border-color)] text-xs">
                            <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] font-semibold border-b border-[var(--border-color)]">
                                <tr>
                                    {Object.keys(reportData[0]).map((header) => (
                                        <th key={header} className="px-6 py-3.5 text-left">
                                            {header.replace(/_/g, ' ')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {reportData.map((row: any, idx) => (
                                    <tr key={idx} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                                        {Object.values(row).map((val: any, i) => (
                                            <td key={i} className="px-6 py-3.5 whitespace-nowrap text-xs text-[var(--text-main)] font-mono">
                                                {typeof val === 'number' && JSON.stringify(val).includes('.')
                                                    ? val.toFixed(2)
                                                    : val}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeReport && !loading && reportData.length === 0 && (
                <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">No records found for the selected report parameters.</p>
                </div>
            )}
        </div>
    );
};

export default ReportsSection;
