import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { PawnRequest } from '../lib/supabase';
import { platformSyncService } from '../services/platformSyncService';
import Footer from '../components/Footer';
import { BackButton } from '../components/ui/BackButton';
import { Calculator, Scale, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { validatePositiveNumber, validateMinLength, validateMaxLength, validateRequired } from '../utils/validation';
import { FormFieldError } from '../components/FormFieldError';
import { formatCurrencyINR, formatDate } from '../utils/formatters';
import { staggerContainer, staggerItemVariants, EASINGS } from '../utils/motion';

const Pawn: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(10000);
  const [rate, setRate] = useState<number>(2.5);
  const [time, setTime] = useState<number>(6);
  const [durationUnit, setDurationUnit] = useState<'months' | 'years'>('months');
  const [amount, setAmount] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);

  // Pawn request form state
  const [itemDescription, setItemDescription] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ itemDescription?: string; requestedAmount?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // User's pawn requests
  const [pawnRequests, setPawnRequests] = useState<PawnRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    fetchPawnRequests();

    // Set up real-time subscription for pawn requests
    let subscription: any = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (subscription) {
          supabase.removeChannel(subscription);
        }

        subscription = supabase
          .channel(`pawn_requests_user_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pawn_requests',
              filter: `user_id=eq.${user.id}`
            },
            () => {
              fetchPawnRequests();
            }
          )
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              if (retryTimeout) clearTimeout(retryTimeout);
              retryTimeout = setTimeout(setupSubscription, 5000);
            }
          });
      } catch (err) {
        console.error('Fatal error in subscription setup:', err);
      }
    };

    setupSubscription();

    // Auto-refresh fallback
    pollInterval = setInterval(() => {
      fetchPawnRequests();
    }, 15000);

    // Cross-tab live synchronization with Admin Portal
    const unsubPlatformSync = platformSyncService.subscribe('pawnshop', () => {
      fetchPawnRequests();
    });

    return () => {
      if (subscription) supabase.removeChannel(subscription);
      if (pollInterval) clearInterval(pollInterval);
      if (retryTimeout) clearTimeout(retryTimeout);
      unsubPlatformSync();
    };
  }, []);

  const fetchPawnRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPawnRequests([]);
        return;
      }

      const { data, error } = await supabase
        .from('pawn_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPawnRequests(data || []);
    } catch {
      setPawnRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const calculateInterest = () => {
    const timeInMonths = durationUnit === 'years' ? time * 12 : time;
    const totalInterest = principal * (rate / 100) * timeInMonths;
    const finalAmount = principal + totalInterest;

    setAmount(finalAmount);
    setInterest(totalInterest);
  };

  const handlePawnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const errs: { itemDescription?: string; requestedAmount?: string } = {};
    if (!validateRequired(itemDescription)) {
      errs.itemDescription = 'Item description is required';
    } else if (!validateMinLength(itemDescription, 10)) {
      errs.itemDescription = 'Please provide detailed specifications (at least 10 characters)';
    } else if (!validateMaxLength(itemDescription, 1000)) {
      errs.itemDescription = 'Description cannot exceed 1000 characters';
    }

    if (!validatePositiveNumber(requestedAmount)) {
      errs.requestedAmount = 'Please enter a valid loan amount greater than ₹0';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setLoading(false);
      return;
    }

    setFieldErrors({});

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to submit a pawn request');
        return;
      }

      const { error: insertError } = await supabase
        .from('pawn_requests')
        .insert({
          user_id: user.id,
          item_description: itemDescription.trim(),
          requested_amount: parseFloat(requestedAmount),
          status: 'pending'
        });

      if (insertError) throw insertError;

      setSuccess('Pawn appraisal request submitted successfully. Our valuation team will review it shortly.');
      setItemDescription('');
      setRequestedAmount('');
      setFieldErrors({});
      fetchPawnRequests();
    } catch (err: any) {
      console.error('Pawn request submission error:', err);
      if (err.message?.includes('fetch failed') || err.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        setError('Database connection temporarily unavailable. Please try again later.');
      } else {
        setError(err.message || 'Failed to submit pawn request');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold badge-status-approved">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold badge-status-rejected">
            <XCircle className="h-3.5 w-3.5" />
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold badge-status-pending">
            <Clock className="h-3.5 w-3.5" />
            Under Valuation
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Top Navigation Back Button */}
        <div className="mb-6">
          <BackButton fallbackPath="/" label="Back to Storefront" variant="pill" />
        </div>

        {/* Editorial Page Header */}
        <div className="mb-10 pb-6 border-b border-[var(--border-color)]">
          <span className="text-[11px] font-semibold tracking-[0.22em] text-[var(--gold-primary)] uppercase block mb-1.5">
            Licensed Collateral Lending &bull; Regulated Rates
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-inter font-bold text-[var(--text-main)] tracking-tight">
            Pawn &amp; Collateral Services
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 text-sm sm:text-base font-normal max-w-2xl leading-relaxed">
            Transparent liquidity secured against certified bullion, fine ornaments, and precious metals. Fully insured vaults, calibrated digital scales, and instant settlements.
          </p>
        </div>

        {/* Dual Primary Instruments */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          
          {/* 1. Loan & Repayment Calculator */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.45, ease: EASINGS.velvet }}
            className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-[var(--border-color)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center text-[var(--gold-primary)]">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-inter font-bold text-[var(--text-main)]">Repayment Estimator</h2>
                <p className="text-xs text-[var(--text-secondary)]">Simulate monthly interest accrual and contract redemption totals</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Principal Borrowing (₹)
                </label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg text-sm tabular-nums focus:outline-none focus:border-[var(--gold-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Monthly Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg text-sm tabular-nums focus:outline-none focus:border-[var(--gold-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Expected Contract Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={time}
                    onChange={(e) => setTime(Math.max(1, Number(e.target.value)))}
                    className="flex-1 px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg text-sm tabular-nums focus:outline-none focus:border-[var(--gold-primary)]"
                  />
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as 'months' | 'years')}
                    className="w-32 px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] font-semibold rounded-lg text-xs focus:outline-none focus:border-[var(--gold-primary)]"
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              <button
                onClick={calculateInterest}
                className="w-full mt-2 bg-[var(--gold-primary)] text-black font-semibold py-3 rounded-lg uppercase tracking-wider text-xs hover:brightness-105 active:scale-[0.99] transition-all shadow-sm"
              >
                Calculate Repayment Breakdown
              </button>

              <AnimatePresence>
                {amount > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: EASINGS.velvet }}
                    className="mt-5 p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)] space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)]">
                        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Total Repayable</p>
                        <p className="text-lg price-total text-[var(--gold-primary)] mt-0.5">{formatCurrencyINR(amount)}</p>
                      </div>
                      <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)]">
                        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Total Interest</p>
                        <p className="text-lg price-total text-[var(--text-main)] mt-0.5">{formatCurrencyINR(interest)}</p>
                      </div>
                      <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)]">
                        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Total Period</p>
                        <p className="text-base font-semibold text-[var(--text-main)] mt-0.5">
                          {durationUnit === 'years' ? time * 12 : time} Months
                        </p>
                      </div>
                      <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)]">
                        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Monthly Service</p>
                        <p className="text-base number-supporting font-semibold text-[var(--text-main)] mt-0.5">
                          {formatCurrencyINR(principal * (rate / 100))}
                        </p>
                      </div>
                    </div>

                    {/* Amortization schedule summary */}
                    <div className="overflow-hidden border border-[var(--border-color)] rounded-lg">
                      <table className="min-w-full divide-y divide-[var(--border-color)]">
                        <thead className="bg-[var(--bg-card)]">
                          <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Milestone</th>
                            <th className="px-3 py-2 text-right text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Interest Accrued</th>
                            <th className="px-3 py-2 text-right text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Settlement Balance</th>
                          </tr>
                        </thead>
                        <tbody className="bg-[var(--bg-elevated)] divide-y divide-[var(--border-color)]">
                          {[...Array(Math.min(durationUnit === 'years' ? time * 12 : time, 6))].map((_, i) => {
                            const month = i + 1;
                            const monthlyInterest = principal * (rate / 100);
                            const accumInterest = monthlyInterest * month;
                            return (
                              <tr key={i} className="hover:bg-[var(--bg-card)] transition-colors">
                                <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">Month {month}</td>
                                <td className="px-3 py-2 text-xs text-right text-[var(--text-main)] number-supporting">{formatCurrencyINR(accumInterest)}</td>
                                <td className="px-3 py-2 text-xs text-right text-[var(--gold-primary)] price-product font-semibold">{formatCurrencyINR(principal + accumInterest)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* 2. Official Valuation / Pledge Request Form */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.45, delay: 0.08, ease: EASINGS.velvet }}
            className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 shadow-sm hover:shadow-xl flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-[var(--border-color)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center text-[var(--gold-primary)]">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-inter font-bold text-[var(--text-main)]">Submit Appraisal Request</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Direct vault submission for certified hallmarked collateral</p>
                </div>
              </div>

              <form onSubmit={handlePawnRequest} className="space-y-4 text-xs">
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-lg text-xs leading-relaxed">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-3 rounded-lg text-xs leading-relaxed">
                    {success}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Item Description &amp; Specifications *
                  </label>
                  <textarea
                    value={itemDescription}
                    onChange={(e) => {
                      setItemDescription(e.target.value);
                      if (fieldErrors.itemDescription) setFieldErrors(prev => ({ ...prev, itemDescription: undefined }));
                    }}
                    rows={4}
                    aria-invalid={Boolean(fieldErrors.itemDescription)}
                    aria-describedby={fieldErrors.itemDescription ? "pawn-desc-error" : undefined}
                    className={`w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border ${fieldErrors.itemDescription ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] rounded-lg text-sm focus:outline-none focus:border-[var(--gold-primary)]`}
                    placeholder="Specify metal type (22K Gold, 24K Bullion, 925 Silver), gross weight in grams, hallmark stamp, gemstones, and condition..."
                    required
                  />
                  <FormFieldError id="pawn-desc-error" error={fieldErrors.itemDescription} />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Requested Advance Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={requestedAmount}
                    onChange={(e) => {
                      setRequestedAmount(e.target.value);
                      if (fieldErrors.requestedAmount) setFieldErrors(prev => ({ ...prev, requestedAmount: undefined }));
                    }}
                    step="0.01"
                    min="1"
                    aria-invalid={Boolean(fieldErrors.requestedAmount)}
                    aria-describedby={fieldErrors.requestedAmount ? "pawn-amount-error" : undefined}
                    className={`w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border ${fieldErrors.requestedAmount ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] rounded-lg text-sm tabular-nums focus:outline-none focus:border-[var(--gold-primary)]`}
                    placeholder="e.g. 50000"
                    required
                  />
                  <FormFieldError id="pawn-amount-error" error={fieldErrors.requestedAmount} />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[var(--gold-primary)] text-black font-semibold py-3 rounded-lg uppercase tracking-wider text-xs hover:brightness-105 active:scale-[0.99] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting Valuation Request...' : 'Submit Appraisal Request'}
                </button>
              </form>
            </div>

            <div className="mt-8 pt-4 border-t border-[var(--border-color)] grid grid-cols-3 gap-2 text-center text-[10px] text-[var(--text-secondary)] font-medium">
              <span>Insured Vault Custody</span>
              <span>Calibrated Scale Assay</span>
              <span>Direct Bank Settlement</span>
            </div>
          </motion.div>
        </div>

        {/* User's Active Applications Portfolio */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--border-color)]">
            <div>
              <h2 className="text-xl font-inter font-bold text-[var(--text-main)]">Your Submitted Appraisals</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Live status tracking for online collateral appraisal tickets</p>
            </div>
            <button
              onClick={() => {
                setRequestsLoading(true);
                fetchPawnRequests();
              }}
              disabled={requestsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg hover:border-[var(--gold-primary)] transition-colors disabled:opacity-50"
              title="Refresh requests"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[var(--gold-primary)] ${requestsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {requestsLoading ? (
            <div className="text-center py-12 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
              <p className="text-[var(--text-secondary)] text-xs">Retrieving your appraisal portfolio...</p>
            </div>
          ) : pawnRequests.length === 0 ? (
            <div className="bg-[var(--bg-card)] p-10 rounded-xl border border-[var(--border-color)] text-center">
              <Scale className="h-10 w-10 text-[var(--gold-primary)]/30 mx-auto mb-3" />
              <h3 className="font-inter text-base font-semibold text-[var(--text-main)] mb-1">No Active Appraisal Requests</h3>
              <p className="text-[var(--text-secondary)] text-xs max-w-sm mx-auto">You have not submitted any pawn appraisal requests yet. Use the application form above to begin.</p>
            </div>
          ) : (
            <motion.div 
              variants={staggerContainer(0.06, 0.02)}
              initial="initial"
              animate="animate"
              className="grid md:grid-cols-2 gap-4"
            >
              {pawnRequests.map((request) => (
                <motion.div 
                  key={request.id} 
                  variants={staggerItemVariants}
                  whileHover={{ y: -3 }}
                  className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-color)] hover:border-[var(--gold-primary)] transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-main)] mb-1.5 leading-snug">{request.item_description}</p>
                      <p className="text-lg font-bold text-[var(--gold-primary)] tabular-nums mb-1">
                        {formatCurrencyINR(request.requested_amount)}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Submitted {formatDate(request.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Pawn;
