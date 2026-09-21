import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, required, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink/80">
            {label}
            {required && <span className="text-maroon-600"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-white/80 px-4 py-2.5 text-ink placeholder:text-ink/40',
            'focus:outline-none focus:ring-2 focus:ring-maroon-500/40 focus:border-maroon-500 transition-colors',
            error ? 'border-red-400' : 'border-ink/15',
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-ink/50">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, required, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink/80">
            {label}
            {required && <span className="text-maroon-600"> *</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-white/80 px-4 py-2.5 text-ink placeholder:text-ink/40 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-maroon-500/40 focus:border-maroon-500 transition-colors',
            error ? 'border-red-400' : 'border-ink/15',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!error && hint && <p className="text-xs text-ink/50">{hint}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'onChange'>, FieldWrapperProps {
  options: SelectOption[];
  onChange?: (value: string) => void;
  value?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, required, id, options, onChange, value, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink/80">
            {label}
            {required && <span className="text-maroon-600"> *</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            'w-full rounded-xl border bg-white/80 px-4 py-2.5 text-ink',
            'focus:outline-none focus:ring-2 focus:ring-maroon-500/40 focus:border-maroon-500 transition-colors',
            error ? 'border-red-400' : 'border-ink/15',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';
