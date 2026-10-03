'use client';

/**
 * Button component supporting primary, secondary, ghost, and danger variants.
 * Strict flat styling with 6px radius and 2px orange focus ring.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-[6px] select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-2';

  const sizes = {
    sm: 'text-[12px] px-2.5 py-1.5 gap-1.5 h-7',
    md: 'text-[13px] px-3.5 py-2 gap-2 h-8',
    lg: 'text-[14px] px-4 py-2.5 gap-2.5 h-10',
  };

  const variants = {
    primary:
      'bg-[#FF6A1A] text-[#0A0A0A] font-semibold hover:bg-[#FF7F3A] active:bg-[#E55A0F]',
    secondary:
      'bg-[#161616] text-[#EDEDED] border border-[#242424] hover:bg-[#1C1C1C] hover:border-[#333333] active:bg-[#111111]',
    ghost:
      'bg-transparent text-[#8C8C8C] hover:text-[#EDEDED] hover:bg-[#161616] active:bg-[#1C1C1C]',
    danger:
      'bg-transparent text-[#F85149] border border-[#F85149]/30 hover:bg-[#F85149]/10 active:bg-[#F85149]/20',
    outline:
      'bg-transparent text-[#EDEDED] border border-[#242424] hover:border-[#FF6A1A] hover:text-[#FF6A1A]',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
