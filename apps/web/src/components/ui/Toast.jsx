'use client';

import { useState } from 'react';

/**
 * Tooltip component (lightweight, zero dependency).
 */
export function Tooltip({ text, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`absolute z-40 whitespace-nowrap bg-[#161616] text-[#EDEDED] text-[11px] px-2 py-1 rounded-[4px] border border-[#333333] pointer-events-none ${positions[position]}`}
        >
          {text}
        </div>
      )}
    </div>
  );
}

/**
 * Toast component (flat, bottom-right, dismissible, aria-live).
 */
export function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const typeStyles = {
    info: 'border-[#242424] text-[#EDEDED]',
    success: 'border-[#3FB950]/30 text-[#3FB950]',
    error: 'border-[#F85149]/30 text-[#F85149]',
    warning: 'border-[#D29922]/30 text-[#D29922]',
  };

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 bg-[#161616] border rounded-[6px] text-[12px] shadow-none ${typeStyles[type] || typeStyles.info}`}
    >
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-[#8C8C8C] hover:text-[#EDEDED] p-0.5 rounded cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
}
