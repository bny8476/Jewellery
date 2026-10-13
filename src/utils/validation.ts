// ==============================================================================
// RCB Jewellery & Pawn Shop - Comprehensive Validation Engine
// ==============================================================================

/**
 * Checks if a string is strictly a finite numeric representation.
 * Rejects partially parsed alphanumeric strings such as '12abc' or '10.5xyz'.
 */
export const isStrictNumericString = (str: string): boolean => {
    if (typeof str !== 'string') return false;
    const trimmed = str.trim();
    if (!trimmed) return false;
    // Strict decimal and scientific notation regex
    return /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(trimmed);
};

/**
 * Validates phone number (Indian format: 10 digits starting with 6-9, optional +91 or 0 prefix)
 */
export const validatePhone = (phone: string | null | undefined): boolean => {
    if (!phone || typeof phone !== 'string') return false;
    const cleaned = phone.replace(/[\s\-()]/g, '');
    const phoneRegex = /^(\+91|0)?[6-9]\d{9}$/;
    return phoneRegex.test(cleaned);
};

/**
 * Validates email address (Standard RFC 5322 practical format)
 * Returns true if empty (optional field).
 */
export const validateEmail = (email: string | null | undefined): boolean => {
    if (!email || !email.trim()) return true; // Optional field
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(email.trim());
};

/**
 * Validates Indian PIN code (6 digits, first digit 1-9)
 * Returns true if empty (optional field).
 */
export const validatePincode = (pincode: string | null | undefined): boolean => {
    if (!pincode || !pincode.trim()) return true; // Optional field
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode.trim());
};

/**
 * Validates format of Indian 12-digit Aadhaar number (with or without spaces/dashes)
 * Note: Validates format structure only; does not claim identity verification.
 * Returns true if empty (optional field).
 */
export const validateAadhar = (aadhar: string | null | undefined): boolean => {
    if (!aadhar || !aadhar.trim()) return true; // Optional field
    const cleaned = aadhar.replace(/[\s-]/g, '');
    const aadharRegex = /^\d{12}$/;
    return aadharRegex.test(cleaned);
};

/**
 * Validates format of Indian PAN number (5 letters, 4 digits, 1 letter)
 * Returns true if empty (optional field).
 */
export const validatePAN = (pan: string | null | undefined): boolean => {
    if (!pan || !pan.trim()) return true; // Optional field
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.trim().toUpperCase());
};

/**
 * Validates positive number (> 0).
 * Strictly rejects '12abc', NaN, Infinity, negative, and zero values.
 */
export const validatePositiveNumber = (value: number | string | null | undefined): boolean => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'string') {
        if (!isStrictNumericString(value)) return false;
        const num = Number(value.trim());
        return Number.isFinite(num) && num > 0;
    }
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
};

/**
 * Validates non-negative number (>= 0).
 * Strictly rejects '12abc', NaN, Infinity, and negative values.
 */
export const validateNonNegativeNumber = (value: number | string | null | undefined): boolean => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'string') {
        if (!isStrictNumericString(value)) return false;
        const num = Number(value.trim());
        return Number.isFinite(num) && num >= 0;
    }
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
};

/**
 * Validates that a numeric value falls within inclusive min and max bounds.
 */
export const validateNumberRange = (
    value: number | string | null | undefined,
    min: number,
    max: number
): boolean => {
    if (value === null || value === undefined || value === '') return false;
    let num: number;
    if (typeof value === 'string') {
        if (!isStrictNumericString(value)) return false;
        num = Number(value.trim());
    } else {
        num = value;
    }
    return Number.isFinite(num) && num >= min && num <= max;
};

/**
 * Validates that a date string is parseable and valid calendar date.
 */
export const isValidDate = (date: string | null | undefined): boolean => {
    if (!date || !date.trim()) return false;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return false;
    
    // Check if ISO/YYYY-MM-DD matches actual calendar days (e.g. reject Feb 31)
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) {
            // Also check local time representation
            if (parsed.getFullYear() !== year || parsed.getMonth() + 1 !== month || parsed.getDate() !== day) {
                return false;
            }
        }
    }
    return true;
};

/**
 * Validates date is not in the future (relative to today).
 * Returns true if empty (optional field).
 */
export const validateDateNotFuture = (date: string | null | undefined): boolean => {
    if (!date || !date.trim()) return true; // Optional field
    if (!isValidDate(date)) return false;
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return inputDate <= today;
};

/**
 * Validates date is not in the past (relative to today).
 * Returns true if empty (optional field).
 */
export const validateDateNotPast = (date: string | null | undefined): boolean => {
    if (!date || !date.trim()) return true; // Optional field
    if (!isValidDate(date)) return false;
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    return inputDate >= today;
};

/**
 * Validates required field (non-empty string after trim, defined, non-null, valid number).
 */
export const validateRequired = (value: unknown): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !Number.isNaN(value);
    if (typeof value === 'boolean') return true;
    if (Array.isArray(value)) return value.length > 0;
    return true;
};

/**
 * Validates minimum length of a string.
 */
export const validateMinLength = (value: string | null | undefined, minLength: number): boolean => {
    if (!value || typeof value !== 'string') return false;
    return value.trim().length >= minLength;
};

/**
 * Validates maximum length of a string.
 */
export const validateMaxLength = (value: string | null | undefined, maxLength: number): boolean => {
    if (!value || typeof value !== 'string') return true;
    return value.trim().length <= maxLength;
};

/**
 * Validates password strength (defaults to at least 6 characters).
 */
export const validatePassword = (password: string | null | undefined, minLength = 6): boolean => {
    if (!password || typeof password !== 'string') return false;
    return password.length >= minLength;
};

/**
 * Cross-field validator for item gross and net weights.
 */
export const validateGrossAndNetWeight = (
    grossWeight: number | string,
    netWeight?: number | string
): { isValid: boolean; error?: string } => {
    if (!validatePositiveNumber(grossWeight)) {
        return { isValid: false, error: 'Gross weight must be a positive number' };
    }
    if (netWeight !== undefined && netWeight !== null && netWeight !== '') {
        if (!validatePositiveNumber(netWeight)) {
            return { isValid: false, error: 'Net weight must be a positive number' };
        }
        const gross = Number(grossWeight);
        const net = Number(netWeight);
        if (net > gross) {
            return { isValid: false, error: 'Net weight cannot exceed gross weight' };
        }
    }
    return { isValid: true };
};

/**
 * Interface defining validation rules for a specific field.
 */
export interface ValidationRules {
    required?: boolean;
    requiredMessage?: string;
    phone?: boolean;
    email?: boolean;
    pincode?: boolean;
    aadhar?: boolean;
    pan?: boolean;
    positiveNumber?: boolean;
    nonNegativeNumber?: boolean;
    minNumber?: number;
    maxNumber?: number;
    isValidDate?: boolean;
    dateNotFuture?: boolean;
    dateNotPast?: boolean;
    minLength?: number;
    maxLength?: number;
    password?: boolean;
    passwordMinLength?: number;
    custom?: (value: unknown) => string | null | undefined | boolean;
}

/**
 * Evaluates rules against a field value and returns the first error message, or null if valid.
 */
export const getValidationError = (
    fieldName: string,
    value: unknown,
    validations: ValidationRules
): string | null => {
    const isPresent = validateRequired(value);

    // 1. Check Required
    if (validations.required && !isPresent) {
        return validations.requiredMessage || `${fieldName} is required`;
    }

    // If field is optional and empty, skip format checks
    if (!isPresent) {
        return null;
    }

    const strVal = typeof value === 'string' ? value : String(value);

    // 2. Format checks
    if (validations.phone && !validatePhone(strVal)) {
        return 'Please enter a valid 10-digit Indian phone number';
    }

    if (validations.email && !validateEmail(strVal)) {
        return 'Please enter a valid email address';
    }

    if (validations.pincode && !validatePincode(strVal)) {
        return 'Please enter a valid 6-digit Indian PIN code';
    }

    if (validations.aadhar && !validateAadhar(strVal)) {
        return 'Please enter a valid 12-digit Aadhaar number';
    }

    if (validations.pan && !validatePAN(strVal)) {
        return 'Please enter a valid PAN format (e.g. ABCDE1234F)';
    }

    // 3. Numeric checks
    if (validations.positiveNumber && !validatePositiveNumber(value as any)) {
        return `${fieldName} must be a positive number`;
    }

    if (validations.nonNegativeNumber && !validateNonNegativeNumber(value as any)) {
        return `${fieldName} cannot be negative`;
    }

    if (validations.minNumber !== undefined && Number(value) < validations.minNumber) {
        return `${fieldName} must be at least ${validations.minNumber}`;
    }

    if (validations.maxNumber !== undefined && Number(value) > validations.maxNumber) {
        return `${fieldName} cannot exceed ${validations.maxNumber}`;
    }

    // 4. Date checks
    if (validations.isValidDate && !isValidDate(strVal)) {
        return 'Please enter a valid date';
    }

    if (validations.dateNotFuture && !validateDateNotFuture(strVal)) {
        return 'Date cannot be in the future';
    }

    if (validations.dateNotPast && !validateDateNotPast(strVal)) {
        return 'Date cannot be in the past';
    }

    // 5. Length & Password checks
    if (validations.minLength && !validateMinLength(strVal, validations.minLength)) {
        return `${fieldName} must be at least ${validations.minLength} characters`;
    }

    if (validations.maxLength && !validateMaxLength(strVal, validations.maxLength)) {
        return `${fieldName} cannot exceed ${validations.maxLength} characters`;
    }

    if (validations.password && !validatePassword(strVal, validations.passwordMinLength || 6)) {
        return `Password must be at least ${validations.passwordMinLength || 6} characters`;
    }

    // 6. Custom rule
    if (validations.custom) {
        const customResult = validations.custom(value);
        if (typeof customResult === 'string') {
            return customResult;
        }
        if (customResult === false) {
            return `Invalid ${fieldName}`;
        }
    }

    return null;
};

/**
 * Validates a complete form record against a rule map.
 * Returns an error map of fieldName -> errorMessage.
 */
export const validateFormRecord = <T extends Record<string, any>>(
    data: T,
    rules: Partial<Record<keyof T, ValidationRules>>
): Record<string, string> => {
    const errors: Record<string, string> = {};
    for (const key in rules) {
        const rule = rules[key];
        if (rule) {
            const err = getValidationError(String(key).replace(/_/g, ' '), data[key], rule);
            if (err) {
                errors[key] = err;
            }
        }
    }
    return errors;
};

/**
 * Validates that an earlier date is on or before a later date.
 */
export const validateDateRange = (startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate) return true;
    if (!isValidDate(startDate) || !isValidDate(endDate)) return false;
    return new Date(startDate).getTime() <= new Date(endDate).getTime();
};

/**
 * Validates that two fields match (e.g. password & password confirmation).
 */
export const validateMatch = (val1: unknown, val2: unknown): boolean => {
    return val1 === val2;
};

export interface FileValidationOptions {
    maxSizeMB?: number;
    allowedTypes?: string[];
}

/**
 * Validates file uploads for size and MIME types.
 */
export const validateFile = (
    file: File | null | undefined,
    options: FileValidationOptions = {}
): { isValid: boolean; error?: string } => {
    if (!file) return { isValid: true };

    if (options.maxSizeMB && file.size > options.maxSizeMB * 1024 * 1024) {
        return { isValid: false, error: `File size cannot exceed ${options.maxSizeMB}MB` };
    }

    if (options.allowedTypes && options.allowedTypes.length > 0) {
        if (!options.allowedTypes.includes(file.type)) {
            return { isValid: false, error: `File type ${file.type || 'unknown'} is not allowed` };
        }
    }

    return { isValid: true };
};
