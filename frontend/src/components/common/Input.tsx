import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-primary mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full px-4 py-3 rounded-xl border transition-all duration-200',
          error
            ? 'border-error focus:border-error focus:ring-1 focus:ring-error'
            : 'border-border focus:border-primary focus:ring-1 focus:ring-primary',
          'bg-surface text-primary placeholder:text-muted',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      )}
    </div>
  );
}
