import React, { useState } from 'react';
import { X, Download, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { CustomerFilterOptions } from '../../../types/pawnshop';
import { exportCustomersCSV, importCustomersCSV } from '../../../services/customerService';
import { toast } from '../../../utils/toast';

interface CustomerImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  currentFilters?: CustomerFilterOptions;
}

export const CustomerImportExportModal: React.FC<CustomerImportExportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  currentFilters
}) => {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importSummary, setImportSummary] = useState<{ importedCount: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const csv = await exportCustomersCSV(currentFilters);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `RCB_Customers_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Customer directory exported successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setImportSummary(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      toast.error('Please upload or paste CSV data first');
      return;
    }

    try {
      setIsImporting(true);
      const result = await importCustomersCSV(csvContent);
      setImportSummary(result);
      if (result.importedCount > 0) {
        toast.success(`Successfully imported ${result.importedCount} new patrons`);
        onImportComplete();
      } else {
        toast.warning('No new patrons were imported. Check validation messages.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const sampleCsvTemplate = `Full Name,Phone,Email,Address,City
Sowmya Ramanathan,9840912345,sowmya.r@gmail.com,12 South Usman Road,Chennai
Karthik Natarajan,9884123456,karthik.n@yahoo.com,45 Gandhipuram,Coimbatore`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsvTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'RCB_Customer_Import_Template.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[var(--bg-card)] border border-[var(--gold-primary)]/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
          <h3 className="text-base font-semibold text-[var(--text-main)]">Import &amp; Export Patron Directory</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
          <button
            onClick={() => setTab('export')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center space-x-2 border-b-2 transition-colors ${
              tab === 'export'
                ? 'border-[var(--gold-primary)] text-[var(--gold-primary)] bg-[var(--gold-primary)]/10'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export Data (CSV)</span>
          </button>
          <button
            onClick={() => setTab('import')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center space-x-2 border-b-2 transition-colors ${
              tab === 'import'
                ? 'border-[var(--gold-primary)] text-[var(--gold-primary)] bg-[var(--gold-primary)]/10'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import Data (CSV)</span>
          </button>
        </div>

        <div className="p-6 text-xs text-[var(--text-secondary)] space-y-4">
          {tab === 'export' ? (
            <div className="space-y-4">
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Export current customer directory including full contact profiles, KYC verification badges, loyalty reward balances, active pawn loan counts, and total purchases.
              </p>

              <div className="p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl space-y-2">
                <span className="font-semibold text-[var(--text-main)] block">Export Columns Included:</span>
                <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                  Customer Code, Full Name, Phone, Email, City, State, Category, KYC Status, Loyalty Tier, Points, Total Purchases (INR), Active Pawn Loans, Outstanding Principal, Outstanding Receivables, Registration Date.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-[var(--gold-primary)] hover:brightness-105 text-stone-900 font-semibold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(198,161,91,0.3)] disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Generating CSV...' : 'Download Complete Customer CSV'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Upload CSV with patron details:</span>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="text-[var(--gold-primary)] hover:underline flex items-center space-x-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Sample Template</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-[var(--bg-elevated)]">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-[var(--gold-primary)] mx-auto mb-2" />
                  <span className="font-medium text-[var(--text-main)] block">Click to upload CSV file</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Supports standard comma-delimited files</span>
                </label>
              </div>

              {csvContent && (
                <div className="space-y-2">
                  <span className="text-[var(--text-secondary)] font-medium">CSV Preview (First few lines):</span>
                  <pre className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[10px] text-[var(--text-main)] overflow-x-auto max-h-24">
                    {csvContent.split('\n').slice(0, 4).join('\n')}
                  </pre>
                </div>
              )}

              {importSummary && (
                <div className={`p-3 rounded-xl border text-xs ${
                  importSummary.importedCount > 0 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  <div className="flex items-center space-x-2 font-semibold mb-1">
                    {importSummary.importedCount > 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>Import Result: {importSummary.importedCount} patrons successfully registered</span>
                  </div>
                  {importSummary.errors.length > 0 && (
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px] text-rose-400 max-h-24 overflow-y-auto">
                      {importSummary.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleImport}
                  disabled={isImporting || !csvContent.trim()}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-stone-900 font-semibold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
                  <span>{isImporting ? 'Processing Data...' : 'Import & Validate Records'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
