import { useState, useCallback } from 'react';
import { ValidationRules, getValidationError } from './validation';

export type ValidationSchema<T> = Partial<Record<keyof T, ValidationRules>>;

export interface UseFormValidationOptions<T> {
    initialValues: T;
    validationSchema: ValidationSchema<T>;
    onSubmit?: (values: T) => void | Promise<void>;
}

export function useFormValidation<T extends Record<string, any>>({
    initialValues,
    validationSchema,
    onSubmit
}: UseFormValidationOptions<T>) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Validates a single field by name
     */
    const validateField = useCallback(
        (name: keyof T, value: any): string | null => {
            const rules = validationSchema[name];
            if (!rules) return null;
            const fieldLabel = String(name).replace(/_/g, ' ');
            return getValidationError(fieldLabel, value, rules);
        },
        [validationSchema]
    );

    /**
     * Handles change for standard HTML input/textarea/select events
     */
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value, type } = e.target;
            const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

            setValues((prev) => ({ ...prev, [name]: val }));

            // If touched, re-validate to clear or update error
            if (touched[name as keyof T]) {
                const error = validateField(name as keyof T, val);
                setErrors((prev) => {
                    const next = { ...prev };
                    if (error) {
                        next[name as keyof T] = error;
                    } else {
                        delete next[name as keyof T];
                    }
                    return next;
                });
            }
        },
        [touched, validateField]
    );

    /**
     * Handles blur event to trigger field-level validation
     */
    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value, type } = e.target;
            const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

            setTouched((prev) => ({ ...prev, [name]: true }));
            const error = validateField(name as keyof T, val);
            setErrors((prev) => {
                const next = { ...prev };
                if (error) {
                    next[name as keyof T] = error;
                } else {
                    delete next[name as keyof T];
                }
                return next;
            });
        },
        [validateField]
    );

    /**
     * Manually updates a field value
     */
    const setFieldValue = useCallback(
        (name: keyof T, value: any) => {
            setValues((prev) => ({ ...prev, [name]: value }));
            if (touched[name]) {
                const error = validateField(name, value);
                setErrors((prev) => {
                    const next = { ...prev };
                    if (error) {
                        next[name] = error;
                    } else {
                        delete next[name];
                    }
                    return next;
                });
            }
        },
        [touched, validateField]
    );

    /**
     * Manually set an error for a field
     */
    const setFieldError = useCallback((name: keyof T, error: string) => {
        setErrors((prev) => ({ ...prev, [name]: error }));
        setTouched((prev) => ({ ...prev, [name]: true }));
    }, []);

    /**
     * Validates all fields across the schema
     * Returns true if all valid, false otherwise.
     */
    const validateAll = useCallback((): boolean => {
        const nextErrors: Partial<Record<keyof T, string>> = {};
        const allTouched: Partial<Record<keyof T, boolean>> = {};

        for (const key in validationSchema) {
            allTouched[key] = true;
            const rules = validationSchema[key];
            if (rules) {
                const fieldLabel = String(key).replace(/_/g, ' ');
                const error = getValidationError(fieldLabel, values[key], rules);
                if (error) {
                    nextErrors[key] = error;
                }
            }
        }

        setTouched(allTouched);
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }, [validationSchema, values]);

    /**
     * Wraps form submission with full validation
     */
    const handleSubmit = useCallback(
        async (e?: React.FormEvent) => {
            if (e) e.preventDefault();
            const isValid = validateAll();
            if (!isValid) return;

            if (onSubmit) {
                try {
                    setIsSubmitting(true);
                    await onSubmit(values);
                } finally {
                    setIsSubmitting(false);
                }
            }
        },
        [onSubmit, validateAll, values]
    );

    /**
     * Resets form to initial or new values
     */
    const resetForm = useCallback(
        (newValues?: T) => {
            setValues(newValues || initialValues);
            setErrors({});
            setTouched({});
            setIsSubmitting(false);
        },
        [initialValues]
    );

    /**
     * Returns accessibility props for an input
     */
    const getFieldProps = useCallback(
        (name: keyof T) => {
            const hasError = Boolean(touched[name] && errors[name]);
            return {
                name: String(name),
                value: values[name] ?? '',
                onChange: handleChange,
                onBlur: handleBlur,
                'aria-invalid': hasError,
                'aria-describedby': hasError ? `${String(name)}-error` : undefined,
                className: hasError
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-[var(--border-color)] focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)]'
            };
        },
        [errors, handleBlur, handleChange, touched, values]
    );

    return {
        values,
        errors,
        touched,
        isSubmitting,
        setIsSubmitting,
        handleChange,
        handleBlur,
        setValues,
        setFieldValue,
        setFieldError,
        validateAll,
        handleSubmit,
        resetForm,
        getFieldProps
    };
}
