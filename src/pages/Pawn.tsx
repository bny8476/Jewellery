import React, { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';
import { PawnRequest } from '../lib/supabase';
import Footer from '../components/Footer';
import { Calculator, Scale, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { validatePositiveNumber, validateMinLength, validateMaxLength, validateRequired } from '../utils/validation';
import { FormFieldError } from '../components/FormFieldError';

const Pawn: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(1000);
  const [rate, setRate] = useState<number>(5);
  const [time, setTime] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<'months' | 'years'>('years');
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
        if (!user) {
          console.log('❌ No user found, skipping subscription');
          return;
        }

        console.log('✅ Setting up real-time subscription for user:', user.id);

        // Cleanup existing if any
        if (subscription) {
          console.log('Cleaning up old subscription before retry...');
          supabase.removeChannel(subscription);
        }

        subscription = supabase
          .channel(`pawn_requests_user_${user.id}`) // Unique channel name per user
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pawn_requests',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('🔔 Pawn request updated!', payload);
              fetchPawnRequests();
            }
          )
          .subscribe((status, err) => {
            console.log(`📡 Subscription status for user ${user.id}:`, status);
            if (err) console.error('🔴 Subscription error:', err);

            if (status === 'CHANNEL_ERROR') {
              console.warn('⚠️ Channel error detected, retrying in 5s...');
              if (retryTimeout) clearTimeout(retryTimeout);
              retryTimeout = setTimeout(setupSubscription, 5000);
            }
          });
      } catch (err) {
        console.error('Fatal error in subscription setup:', err);
      }
    };

    setupSubscription();

    // Auto-refresh every 10 seconds as backup (in case real-time fails)
    pollInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing pawn requests (Heartbeat)...');
      fetchPawnRequests();
    }, 10000);

    // Cleanup subscription and interval on unmount
    return () => {
      console.log('🧹 Cleaning up Pawn.tsx effects...');
      if (subscription) {
        supabase.removeChannel(subscription);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  const fetchPawnRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pawn_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPawnRequests(data || []);
    } catch (error) {
      console.error('Error fetching pawn requests from Supabase, using empty array:', error);
      // Use empty array as fallback when Supabase is not available
      setPawnRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const calculateInterest = () => {
    // Treat 'rate' as Monthly Interest Rate
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

      setSuccess('Pawn request submitted successfully! We will review it shortly.');
      setItemDescription('');
      setRequestedAmount('');
      setFieldErrors({});
      fetchPawnRequests();
    } catch (error: any) {
      console.error('Pawn request submission error:', error);
      if (error.message?.includes('fetch failed') || error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        setError('Database connection unavailable. Please try again later or contact support.');
      } else {
        setError(error.message || 'Failed to submit pawn request');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-200">
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-10 pb-6 border-b border-[var(--border-color)]">
          <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[var(--gold-primary)] uppercase block mb-2">
            PREMIER COLLATERAL LENDING
          </span>
          <h1 className="text-3xl md:text-5xl font-serif text-[var(--text-main)] tracking-tight">
            Pawn &amp; Loan Services
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 text-sm md:text-base font-light max-w-2xl">
            Instant liquidity secured against certified bullion, fine jewellery, and luxury assets with transparent RBI-aligned interest structures.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Interest Calculator */}
          <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-card)]">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center mr-3">
                <Calculator className="h-5 w-5 text-[var(--gold-primary)]" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">Interest Calculator</h2>
                <p className="text-xs text-[var(--text-secondary)]">Simulate monthly compounding or simple interest rates</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider text-[11px]">
                  Principal Amount (₹)
                </label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl focus:outline-none focus:border-[var(--gold-primary)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider text-[11px]">
                  Monthly Interest Rate (%)
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl focus:outline-none focus:border-[var(--gold-primary)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider text-[11px]">
                  Loan Tenure
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={time}
                    onChange={(e) => setTime(Number(e.target.value))}
                    className="flex-1 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl focus:outline-none focus:border-[var(--gold-primary)]"
                  />
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as 'months' | 'years')}
                    className="w-32 px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--gold-primary)] font-semibold rounded-xl focus:outline-none focus:border-[var(--gold-primary)]"
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              <button
                onClick={calculateInterest}
                className="w-full mt-2 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-black font-semibold py-3 rounded-xl uppercase tracking-wider text-xs hover:brightness-105 transition-all shadow-md"
              >
                Calculate Repayment
              </button>

              {amount > 0 && (
                <div className="mt-6 p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)] space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Total Repayable</p>
                      <p className="text-base font-serif font-bold text-gold-gradient">₹{amount.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Accrued Interest</p>
                      <p className="text-base font-serif font-bold text-[var(--text-main)]">₹{interest.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Effective %</p>
                      <p className="text-base font-serif font-bold text-[var(--gold-primary)]">{((interest / principal) * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Total Months</p>
                      <p className="text-base font-serif font-bold text-[var(--text-main)]">
                        {durationUnit === 'years' ? time * 12 : time}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {amount > 0 && (
                <div className="mt-4 overflow-hidden border border-[var(--border-color)] rounded-xl">
                  <table className="min-w-full divide-y divide-[var(--border-color)]">
                    <thead className="bg-[var(--bg-elevated)]">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Period</th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Interest</th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[var(--bg-card)] divide-y divide-[var(--border-color)]">
                      {[...Array(Math.min(durationUnit === 'years' ? time * 12 : time, 12))].map((_, i) => {
                        const month = i + 1;
                        const monthlyInterest = principal * (rate / 100);
                        const accumInterest = monthlyInterest * month;
                        return (
                          <tr key={i} className="hover:bg-[var(--bg-elevated)] transition-colors">
                            <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">Month {month}</td>
                            <td className="px-3 py-2 text-xs text-[var(--gold-primary)] font-semibold">₹{accumInterest.toFixed(0)}</td>
                            <td className="px-3 py-2 text-xs text-[var(--text-main)] font-semibold">₹{(principal + accumInterest).toFixed(0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Pawn Request Form */}
          <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-card)] flex flex-col justify-between">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center mr-3">
                  <Scale className="h-5 w-5 text-[var(--gold-primary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">Submit Pledge Request</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Receive official valuation and instant approval</p>
                </div>
              </div>

              <form onSubmit={handlePawnRequest} className="space-y-4 text-xs">
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 px-4 py-3 rounded-xl text-xs">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-4 py-3 rounded-xl text-xs">
                    {success}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider text-[11px]">
                    Item Description &amp; Specifications
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
                    className={`w-full px-4 py-3 bg-[var(--bg-elevated)] border ${fieldErrors.itemDescription ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] rounded-xl focus:outline-none focus:border-[var(--gold-primary)]`}
                    placeholder="Provide details: metal type (22K Gold, 24K Gold, Silver), gross weight in grams, hallmark stamp, gemstones, condition..."
                    required
                  />
                  <FormFieldError id="pawn-desc-error" error={fieldErrors.itemDescription} />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider text-[11px]">
                    Requested Loan Amount (₹)
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
                    className={`w-full px-4 py-2.5 bg-[var(--bg-elevated)] border ${fieldErrors.requestedAmount ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] rounded-xl focus:outline-none focus:border-[var(--gold-primary)]`}
                    placeholder="Enter target loan amount in INR"
                    required
                  />
                  <FormFieldError id="pawn-amount-error" error={fieldErrors.requestedAmount} />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-black font-semibold py-3.5 rounded-xl uppercase tracking-wider text-xs hover:brightness-105 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting Valuation Request...' : 'Submit Pledge Request'}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
              <span>✓ Safe Custody Vault Security</span>
              <span>✓ Transparent Weighing</span>
              <span>✓ Instant Bank NEFT / Cash</span>
            </div>
          </div>
        </div>

        {/* Pawn Requests History */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-[var(--gold-primary)] mr-2.5" />
              <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">Your Pledge Applications</h2>
            </div>
            <button
              onClick={() => {
                setRequestsLoading(true);
                fetchPawnRequests();
              }}
              disabled={requestsLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[var(--gold-primary)] bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg hover:border-[var(--gold-primary)] transition-colors disabled:opacity-50"
              title="Refresh requests"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${requestsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {requestsLoading ? (
            <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
              <p className="text-[var(--text-secondary)] text-sm">Retrieving your pledge portfolio...</p>
            </div>
          ) : pawnRequests.length === 0 ? (
            <div className="bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border-color)] text-center">
              <Scale className="h-12 w-12 text-[var(--gold-primary)]/30 mx-auto mb-3" />
              <h3 className="font-serif text-lg text-[var(--text-main)] mb-1">No Active Pledge Requests</h3>
              <p className="text-[var(--text-secondary)] text-xs">You have not submitted any pawn loan requests yet. Use the application form above to begin.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {pawnRequests.map((request) => (
                <div key={request.id} className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-serif text-[var(--text-main)] mb-2 leading-relaxed">{request.item_description}</p>
                      <p className="text-xl font-serif font-bold text-gold-gradient mb-2">
                        ₹{request.requested_amount.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Submitted on {new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {getStatusIcon(request.status)}
                      <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Pawn;
