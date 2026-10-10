import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldErrorProps {
    id?: string;
    error?: string | null;
    touched?: boolean;
    className?: string;
}

export const FormFieldError: React.FC<FormFieldErrorProps> = ({
    id,
    error,
    touched = true,
    className = ''
}) => {
    if (!error || !touched) return null;

    return (
        <div
            id={id}
            role="alert"
            aria-live="polite"
            className={`flex items-center gap-1.5 text-[11px] text-rose-500 font-medium mt-1 transition-all animate-fadeIn ${className}`}
        >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
        </div>
    );
};
