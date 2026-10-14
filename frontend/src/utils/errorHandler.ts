// Error handling utility for user-friendly error messages

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Maps Supabase/PostgreSQL errors to user-friendly messages
 */
export const mapError = (error: any): string => {
  if (!error) return 'An unknown error occurred';

  // Check for Supabase error structure
  const errorMessage = error.message || error.error?.message || String(error);
  const errorCode = error.code || error.error?.code;

  // PostgreSQL error codes
  if (errorCode === '23505') {
    return 'This record already exists. Please use a different value.';
  }
  
  if (errorCode === '23503') {
    return 'Cannot perform this action: Related record not found.';
  }
  
  if (errorCode === '23502') {
    return 'Required field is missing. Please fill all required fields.';
  }
  
  if (errorCode === '42501') {
    return 'Permission denied: You do not have access to perform this action.';
  }
  
  if (errorCode === 'PGRST116') {
    return 'The requested record was not found.';
  }

  // Common error patterns
  if (errorMessage.includes('foreign key')) {
    return 'Cannot delete: This record is being used elsewhere.';
  }
  
  if (errorMessage.includes('unique constraint')) {
    return 'This value already exists. Please use a different value.';
  }
  
  if (errorMessage.includes('not null')) {
    return 'Required field is missing. Please fill all required fields.';
  }
  
  if (errorMessage.includes('invalid input syntax')) {
    return 'Invalid data format. Please check your input.';
  }
  
  if (errorMessage.includes('JWT')) {
    return 'Authentication error. Please log in again.';
  }
  
  if (errorMessage.includes('Row Level Security')) {
    return 'Access denied: You do not have permission to perform this action.';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Return original message if no mapping found
  return errorMessage || 'An error occurred. Please try again.';
};

/**
 * Wraps an async function with error handling
 */
export const handleApiError = async <T>(
  fn: () => Promise<T>,
  customError?: (error: any) => string
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    const errorMessage = customError ? customError(error) : mapError(error);
    console.error('API Error:', error);
    throw new Error(errorMessage);
  }
};

/**
 * Logs error for debugging (in development only)
 */
export const logError = (error: any, context?: string) => {
  if (import.meta.env.DEV) {
    console.error(`[${context || 'Error'}]`, error);
  }
  // In production, you could send to error tracking service
  // Example: Sentry.captureException(error, { tags: { context } });
};

