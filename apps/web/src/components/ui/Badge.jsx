'use client';

/**
 * Flat Badge component without gradients or pill-everything styling.
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  const variants = {
    default: 'bg-[#1C1C1C] text-[#EDEDED] border border-[#242424]',
    muted: 'bg-[#161616] text-[#8C8C8C] border border-[#242424]',
    accent: 'bg-[#FF6A1A]/10 text-[#FF6A1A] border border-[#FF6A1A]/20',
    success: 'bg-[#3FB950]/10 text-[#3FB950] border border-[#3FB950]/20',
    danger: 'bg-[#F85149]/10 text-[#F85149] border border-[#F85149]/20',
    warning: 'bg-[#D29922]/10 text-[#D29922] border border-[#D29922]/20',
  };

  const sizes = {
    sm: 'text-[11px] px-1.5 py-0.5 rounded-[4px]',
    md: 'text-[12px] px-2 py-0.5 rounded-[4px]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium font-mono tabular-nums leading-none select-none ${
        sizes[size] || sizes.md
      } ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * StatusDot indicator with optional non-glow pulse.
 */
export function StatusDot({ status = 'idle', pulse = false, className = '' }) {
  const colors = {
    idle: 'bg-[#5E5E5E]',
    running: 'bg-[#FF6A1A]',
    active: 'bg-[#FF6A1A]',
    success: 'bg-[#3FB950]',
    completed: 'bg-[#3FB950]',
    failed: 'bg-[#F85149]',
    danger: 'bg-[#F85149]',
    warning: 'bg-[#D29922]',
    awaiting: 'bg-[#D29922]',
  };

  const bg = colors[status] || colors.idle;

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${bg} ${
        pulse ? 'animate-dot-pulse' : ''
      } ${className}`}
    />
  );
}

/**
 * Switch toggle component (flat, 1px border, 16px height).
 */
export function Switch({ checked, onChange, disabled = false, id, label }) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 select-none cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange && onChange(!checked)}
        className={`relative inline-flex h-4 w-7 items-center rounded-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-2 ${
          checked
            ? 'bg-[#FF6A1A] border-[#FF6A1A]'
            : 'bg-[#1C1C1C] border-[#333333]'
        }`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-[#EDEDED] transition-transform duration-150 ${
            checked ? 'translate-x-3.5 bg-[#0A0A0A]' : 'translate-x-0.5'
          }`}
        />
      </button>
      {label && <span className="text-[12px] text-[#8C8C8C]">{label}</span>}
    </label>
  );
}

/**
 * Flat Card component (no heavy drop shadows, 1px border, 6px radius).
 */
export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-[#111111] border border-[#242424] rounded-[6px] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
