import crypto from 'crypto';

// The Verhoeff algorithm tables for 12-digit Aadhaar number validation
const VERHOEFF_D: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const VERHOEFF_P: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

const VERHOEFF_INV: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a 12-digit Aadhaar number using the standard Verhoeff checksum algorithm.
 * Aadhaar numbers must not start with 0 or 1, must be exactly 12 numeric digits,
 * and must pass the Verhoeff checksum check.
 */
export function validateAadhaar(aadhaar: string): { valid: boolean; error?: string } {
  const cleaned = (aadhaar || '').replace(/\s+/g, '');

  if (!cleaned) {
    return { valid: false, error: 'Aadhaar number is required.' };
  }

  if (!/^\d{12}$/.test(cleaned)) {
    return { valid: false, error: 'Aadhaar number must be exactly 12 digits.' };
  }

  if (cleaned[0] === '0' || cleaned[0] === '1') {
    return { valid: false, error: 'Aadhaar number cannot start with 0 or 1.' };
  }

  // Check for repeated sequences like 111111111111 or 123412341234
  if (/^(\d)\1{11}$/.test(cleaned)) {
    return { valid: false, error: 'Aadhaar number cannot consist of repetitive digits.' };
  }

  // Verhoeff checksum calculation
  let c = 0;
  const reversedDigits = cleaned.split('').reverse().map(Number);

  for (let i = 0; i < reversedDigits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][reversedDigits[i]]];
  }

  if (c !== 0) {
    return { valid: false, error: 'Aadhaar checksum failed (Verhoeff validation).' };
  }

  return { valid: true };
}

/**
 * Validates an Indian Permanent Account Number (PAN).
 * Format: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F).
 * 4th character represents entity type:
 * C - Company, P - Person/Individual, H - HUF, F - Firm, A - AOP, T - Trust,
 * B - BOI, L - Local Authority, J - AJP, G - Government.
 */
export function validatePan(pan: string): { valid: boolean; error?: string } {
  const cleaned = (pan || '').trim().toUpperCase();

  if (!cleaned) {
    return { valid: false, error: 'PAN number is required.' };
  }

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid PAN format. Must be 5 uppercase letters, 4 numbers, and 1 letter (e.g. ABCDE1234F).' };
  }

  const fourthChar = cleaned[3];
  const validEntityTypes = ['C', 'P', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'];
  if (!validEntityTypes.includes(fourthChar)) {
    return { valid: false, error: `Invalid PAN 4th character '${fourthChar}'. Must be a valid taxpayer entity type.` };
  }

  return { valid: true };
}

/**
 * Validates Date of Birth ensuring customer is at least 18 years old.
 */
export function validateDateOfBirth(dobString: string): { valid: boolean; error?: string } {
  if (!dobString) {
    return { valid: false, error: 'Date of birth is required.' };
  }

  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) {
    return { valid: false, error: 'Invalid date format.' };
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < 18) {
    return { valid: false, error: 'Customer must be at least 18 years of age to complete KYC verification.' };
  }

  if (age > 120) {
    return { valid: false, error: 'Please enter a realistic date of birth.' };
  }

  return { valid: true };
}

/**
 * Masks PAN according to regulatory requirements: ABCDE••••F
 */
export function maskPan(pan: string): string {
  const cleaned = (pan || '').trim().toUpperCase();
  if (cleaned.length !== 10) return cleaned;
  return `${cleaned.slice(0, 5)}••••${cleaned.slice(9)}`;
}

/**
 * Masks Aadhaar according to UIDAI masking regulations: •••• •••• 1234
 * Never stores or exposes the first 8 digits in plaintext.
 */
export function maskAadhaar(aadhaar: string): string {
  const cleaned = (aadhaar || '').replace(/\s+/g, '');
  if (cleaned.length !== 12) return cleaned;
  return `•••• •••• ${cleaned.slice(-4)}`;
}

/**
 * Computes a deterministic salted cryptographic hash of PAN or Aadhaar for
 * duplicate submission detection without retaining plaintext.
 */
const SALT = process.env.KYC_HASH_SALT || 'yazhini_fine_jewels_kyc_salt_2026';

export function hashSensitiveIdentifier(value: string): string {
  const cleaned = (value || '').trim().toUpperCase().replace(/\s+/g, '');
  return crypto.createHmac('sha256', SALT).update(cleaned).digest('hex');
}

/**
 * Generates an official YAZHINI KYC Reference ID: KYC-YYYY-XXXXX
 */
export function generateKycReferenceId(): string {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `KYC-${year}-${randomSuffix}`;
}
