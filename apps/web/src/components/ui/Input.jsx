'use client';

/**
 * Input component conforming to the black and orange design system.
 */
export function Input({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-[12px] font-medium text-[#EDEDED] select-none"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full bg-[#161616] text-[#EDEDED] text-[13px] border rounded-[6px] px-3 py-1.5 placeholder-[#5E5E5E] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-[#F85149] focus-visible:outline-[#F85149]'
            : 'border-[#242424] hover:border-[#333333]'
        } ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-[11px] text-[#F85149]">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] text-[#8C8C8C]">{helperText}</span>
      ) : null}
    </div>
  );
}

/**
 * Textarea component.
 */
export function Textarea({
  label,
  error,
  helperText,
  id,
  className = '',
  rows = 3,
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-[12px] font-medium text-[#EDEDED] select-none"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`w-full bg-[#161616] text-[#EDEDED] text-[13px] border rounded-[6px] p-3 placeholder-[#5E5E5E] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-1 disabled:opacity-50 disabled:cursor-not-allowed resize-y ${
          error
            ? 'border-[#F85149] focus-visible:outline-[#F85149]'
            : 'border-[#242424] hover:border-[#333333]'
        } ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-[11px] text-[#F85149]">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] text-[#8C8C8C]">{helperText}</span>
      ) : null}
    </div>
  );
}

/**
 * Select component.
 */
export function Select({
  label,
  error,
  helperText,
  id,
  options = [],
  children,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-[12px] font-medium text-[#EDEDED] select-none"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={`w-full bg-[#161616] text-[#EDEDED] text-[13px] border rounded-[6px] px-3 py-1.5 pr-8 appearance-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
            error
              ? 'border-[#F85149] focus-visible:outline-[#F85149]'
              : 'border-[#242424] hover:border-[#333333]'
          } ${className}`}
          {...props}
        >
          {children ||
            options.map((opt) => (
              <option
                key={opt.value ?? opt}
                value={opt.value ?? opt}
                className="bg-[#111111] text-[#EDEDED]"
              >
                {opt.label ?? opt}
              </option>
            ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8C8C8C]">
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      {error ? (
        <span className="text-[11px] text-[#F85149]">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] text-[#8C8C8C]">{helperText}</span>
      ) : null}
    </div>
  );
}
