import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  Lock,
  FileText,
  Calendar,
  CreditCard,
  User,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import {
  kycService,
  validatePan,
  validateAadhaar,
  validateDob,
  maskPan,
  maskAadhaar
} from '../../services/kycService';
import type { CustomerKycRecord } from '../../types/kyc';

interface CustomerKycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: CustomerKycRecord) => void;
  existingKyc?: CustomerKycRecord | null;
  mode?: 'submit' | 'resubmit';
}

export const CustomerKycModal: React.FC<CustomerKycModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingKyc,
  mode = 'submit'
}) => {
  const [legalName, setLegalName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [dob, setDob] = useState('');
  const [documentType, setDocumentType] = useState('Aadhaar Card');
  const [documentUrl, setDocumentUrl] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  // Field error states
  const [nameError, setNameError] = useState<string | null>(null);
  const [panError, setPanError] = useState<string | null>(null);
  const [aadhaarError, setAadhaarError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedRefId, setGeneratedRefId] = useState('');

  // Pre-fill on resubmit
  useEffect(() => {
    if (existingKyc && mode === 'resubmit') {
      setLegalName(existingKyc.legal_name || '');
      setDob(existingKyc.date_of_birth ? existingKyc.date_of_birth.split('T')[0] : '');
      setDocumentType(existingKyc.document_type || 'Aadhaar Card');
      setDocumentUrl(existingKyc.document_url || '');
      setConsentGiven(false);
    }
  }, [existingKyc, mode]);

  if (!isOpen) return null;

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPanNumber(val);
    if (val.length === 10) {
      const check = validatePan(val);
      setPanError(check.valid ? null : check.error || 'Invalid PAN format');
    } else {
      setPanError(null);
    }
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAadhaarNumber(val);
    if (val.length === 12) {
      const check = validateAadhaar(val);
      setAadhaarError(check.valid ? null : check.error || 'Invalid Aadhaar number');
    } else {
      setAadhaarError(null);
    }
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    if (val) {
      const check = validateDob(val);
      setDobError(check.valid ? null : check.error || 'Invalid Date of Birth');
    } else {
      setDobError(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Document file size must not exceed 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setDocumentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate legal name
    if (!legalName.trim() || legalName.trim().length < 3) {
      setNameError('Full legal name as per identity document is required (min 3 chars).');
      return;
    }
    setNameError(null);

    // Validate PAN
    const panCheck = validatePan(panNumber);
    if (!panCheck.valid) {
      setPanError(panCheck.error || 'Invalid PAN');
      return;
    }
    setPanError(null);

    // Validate Aadhaar
    const aadhaarCheck = validateAadhaar(aadhaarNumber);
    if (!aadhaarCheck.valid) {
      setAadhaarError(aadhaarCheck.error || 'Invalid Aadhaar');
      return;
    }
    setAadhaarError(null);

    // Validate DOB
    const dobCheck = validateDob(dob);
    if (!dobCheck.valid) {
      setDobError(dobCheck.error || 'Invalid DOB');
      return;
    }
    setDobError(null);

    // Validate Consent
    if (!consentGiven) {
      setConsentError('Consent is required to proceed with identity verification under DPDP Act.');
      return;
    }
    setConsentError(null);

    setIsSubmitting(true);
    try {
      const payload = {
        legal_name: legalName.trim(),
        pan_number: panNumber.trim().toUpperCase(),
        aadhaar_number: aadhaarNumber.trim(),
        date_of_birth: dob,
        document_type: documentType,
        document_url: documentUrl || undefined,
        consent_given: true
      };

      let result;
      if (mode === 'resubmit') {
        result = await kycService.resubmitKyc(payload);
      } else {
        result = await kycService.submitKyc(payload);
      }

      if (result.success && result.data) {
        setIsSuccess(true);
        setGeneratedRefId(result.data.reference_id);
        onSuccess(result.data);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while submitting your KYC details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0f1117] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif tracking-wide text-white">
                {mode === 'resubmit' ? 'Correct & Resubmit KYC' : 'Statutory Customer KYC Verification'}
              </h2>
              <p className="text-xs text-amber-400/80 tracking-wider uppercase font-mono">
                Yazhini Fine Jewels &bull; Compliance & Patron Trust
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Previous rejection reason notice if resubmitting */}
        {mode === 'resubmit' && existingKyc?.rejection_reason && (
          <div className="mx-6 mt-5 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold text-rose-300">Previous Reviewer Feedback:</span>
              <p className="text-rose-200/90 mt-1">{existingKyc.rejection_reason}</p>
            </div>
          </div>
        )}

        {mode === 'resubmit' && existingKyc?.action_required_notes && (
          <div className="mx-6 mt-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold text-amber-300">Action Required Notes:</span>
              <p className="text-amber-200/90 mt-1">{existingKyc.action_required_notes}</p>
            </div>
          </div>
        )}

        {isSuccess ? (
          /* Submission Success State */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-serif text-white">KYC Details Submitted Successfully</h3>
              <p className="text-sm text-neutral-400 mt-2 max-w-md mx-auto">
                Your identity verification details have been securely recorded and queued for administrative compliance review.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl max-w-sm mx-auto text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Reference ID:</span>
                <span className="font-mono text-amber-400 font-bold">{generatedRefId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Current Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PENDING VERIFICATION
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Masked PAN:</span>
                <span className="font-mono text-neutral-200">{maskPan(panNumber)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Masked Aadhaar:</span>
                <span className="font-mono text-neutral-200">{maskAadhaar(aadhaarNumber)}</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-medium hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
              >
                Return to Profile
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {submitError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Legal Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Full Legal Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => {
                    setLegalName(e.target.value);
                    setNameError(null);
                  }}
                  placeholder="As printed on your PAN / Aadhaar"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                />
              </div>
              {nameError && <p className="text-xs text-rose-400 mt-1">{nameError}</p>}
            </div>

            {/* PAN & Aadhaar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PAN Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  PAN Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={panNumber}
                    onChange={handlePanChange}
                    maxLength={10}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 font-mono tracking-wider text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 uppercase transition-all"
                  />
                </div>
                {panError ? (
                  <p className="text-xs text-rose-400 mt-1">{panError}</p>
                ) : panNumber.length === 10 ? (
                  <p className="text-xs text-emerald-400 mt-1">Valid PAN format ({maskPan(panNumber)})</p>
                ) : (
                  <p className="text-[11px] text-neutral-500 mt-1">10 alphanumeric characters</p>
                )}
              </div>

              {/* Aadhaar Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  12-Digit Aadhaar Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={handleAadhaarChange}
                    maxLength={12}
                    placeholder="12 numeric digits"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 font-mono tracking-wider text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                </div>
                {aadhaarError ? (
                  <p className="text-xs text-rose-400 mt-1">{aadhaarError}</p>
                ) : aadhaarNumber.length === 12 ? (
                  <p className="text-xs text-emerald-400 mt-1">Checksum passed ({maskAadhaar(aadhaarNumber)})</p>
                ) : (
                  <p className="text-[11px] text-neutral-500 mt-1">Validated via Verhoeff checksum algorithm</p>
                )}
              </div>
            </div>

            {/* Date of Birth & Document Type Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Date of Birth <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="date"
                    value={dob}
                    onChange={handleDobChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all [color-scheme:dark]"
                  />
                </div>
                {dobError ? (
                  <p className="text-xs text-rose-400 mt-1">{dobError}</p>
                ) : (
                  <p className="text-[11px] text-neutral-500 mt-1">Must be at least 18 years old</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Supporting Document Type
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#171923] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Optional Document Upload */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Upload Identity Document (Optional PDF, JPG, PNG &bull; Max 5MB)
              </label>
              <div className="border border-dashed border-white/15 rounded-xl p-4 text-center hover:border-amber-500/40 transition-colors bg-white/[0.02]">
                <input
                  type="file"
                  id="kyc-file-upload"
                  accept="image/png,image/jpeg,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="kyc-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="w-6 h-6 text-amber-400/80" />
                  <span className="text-xs text-neutral-300">
                    {documentUrl ? 'Document Attached (Click to replace)' : 'Click to select image or document'}
                  </span>
                  <span className="text-[10px] text-neutral-500">Secure AES-256 encrypted storage reference</span>
                </label>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => {
                    setConsentGiven(e.target.checked);
                    setConsentError(null);
                  }}
                  className="mt-1 rounded bg-white/5 border-white/20 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-0"
                />
                <span className="text-xs text-neutral-300 leading-relaxed">
                  I hereby declare that the details furnished above are true and correct. I explicitly consent to{' '}
                  <span className="text-amber-400 font-medium">YAZHINI Fine Jewels</span> collecting, verifying,
                  and processing my identity information for statutory KYC compliance in accordance with the{' '}
                  <span className="text-amber-300">Digital Personal Data Protection (DPDP) Act, 2023</span> and
                  PMLA guidelines.
                </span>
              </label>
              {consentError && <p className="text-xs text-rose-400 mt-1">{consentError}</p>}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-medium hover:brightness-110 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying &amp; Submitting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{mode === 'resubmit' ? 'Resubmit Verification' : 'Submit for Verification'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
