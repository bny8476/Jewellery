// Input validation utilities

/**
 * Validates phone number (Indian format)
 */
export const validatePhone = (phone: string): boolean => {
    // Remove spaces and special characters
    const cleaned = phone.replace(/[\s\-()]/g, '');
    // Indian phone numbers: 10 digits, optionally starting with +91
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    return phoneRegex.test(cleaned);
};

/**
 * Validates email
 */
export const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates pincode (Indian format - 6 digits)
 */
export const validatePincode = (pincode: string): boolean => {
    if (!pincode) return true; // Optional field
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
};

/**
 * Validates Aadhar number (12 digits)
 */
export const validateAadhar = (aadhar: string): boolean => {
    if (!aadhar) return true; // Optional field
    const aadharRegex = /^\d{12}$/;
    return aadharRegex.test(aadhar.replace(/\s/g, ''));
};

/**
 * Validates PAN number
 */
export const validatePAN = (pan: string): boolean => {
    if (!pan) return true; // Optional field
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
};

/**
 * Validates positive number
 */
export const validatePositiveNumber = (value: number | string): boolean => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num > 0;
};

/**
 * Validates non-negative number
 */
export const validateNonNegativeNumber = (value: number | string): boolean => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num >= 0;
};

/**
 * Validates date is not in the future
 */
export const validateDateNotFuture = (date: string): boolean => {
    if (!date) return true;
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return inputDate <= today;
};

/**
 * Validates date is not in the past
 */
export const validateDateNotPast = (date: string): boolean => {
    if (!date) return true;
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    return inputDate >= today;
};

/**
 * Validates required field
 */
export const validateRequired = (value: string | number | undefined | null): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
};

/**
 * Validates minimum length
 */
export const validateMinLength = (value: string, minLength: number): boolean => {
    return value.length >= minLength;
};

/**
 * Validates maximum length
 */
export const validateMaxLength = (value: string, maxLength: number): boolean => {
    return value.length <= maxLength;
};

/**
 * Get validation error message
 */
export const getValidationError = (field: string, value: any, validations: {
    required?: boolean;
    phone?: boolean;
    email?: boolean;
    pincode?: boolean;
    aadhar?: boolean;
    pan?: boolean;
    positiveNumber?: boolean;
    nonNegativeNumber?: boolean;
    dateNotFuture?: boolean;
    dateNotPast?: boolean;
    minLength?: number;
    maxLength?: number;
}): string | null => {
    if (validations.required && !validateRequired(value)) {
        return `${field} is required`;
    }

    if (value && validations.phone && !validatePhone(value)) {
        return 'Invalid phone number. Please enter a valid 10-digit Indian phone number';
    }

    if (value && validations.email && !validateEmail(value)) {
        return 'Invalid email address';
    }

    if (value && validations.pincode && !validatePincode(value)) {
        return 'Invalid pincode. Please enter a valid 6-digit pincode';
    }

    if (value && validations.aadhar && !validateAadhar(value)) {
        return 'Invalid Aadhar number. Please enter a valid 12-digit Aadhar number';
    }

    if (value && validations.pan && !validatePAN(value)) {
        return 'Invalid PAN number. Format: ABCDE1234F';
    }

    if (value && validations.positiveNumber && !validatePositiveNumber(value)) {
        return `${field} must be a positive number`;
    }

    if (value && validations.nonNegativeNumber && !validateNonNegativeNumber(value)) {
        return `${field} must be a non-negative number`;
    }

    if (value && validations.dateNotFuture && !validateDateNotFuture(value)) {
        return 'Date cannot be in the future';
    }

    if (value && validations.dateNotPast && !validateDateNotPast(value)) {
        return 'Date cannot be in the past';
    }

    if (value && validations.minLength && typeof value === 'string' && !validateMinLength(value, validations.minLength)) {
        return `${field} must be at least ${validations.minLength} characters`;
    }

    if (value && validations.maxLength && typeof value === 'string' && !validateMaxLength(value, validations.maxLength)) {
        return `${field} must be at most ${validations.maxLength} characters`;
    }

    return null;
};

