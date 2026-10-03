'use client';

import { useEffect } from 'react';

/**
 * Modal component with plain dark backdrop (no blur, 8px radius, trapped focus).
 */
export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
    >
      <div
        className={`w-full ${maxWidth} bg-[#111111] border border-[#333333] rounded-[8px] overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#242424] bg-[#161616]">
            <h3 className="text-[14px] font-semibold text-[#EDEDED] tracking-tight">
              {title}
            </h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-[#8C8C8C] hover:text-[#EDEDED] p-1 rounded-[4px] hover:bg-[#1C1C1C] focus-visible:outline-2 focus-visible:outline-[#FF6A1A]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/**
 * Flat Tabs component.
 */
export function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div className={`flex border-b border-[#242424] bg-[#0A0A0A] ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-2 text-[12px] font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#FF6A1A] cursor-pointer ${
              isActive
                ? 'border-[#FF6A1A] text-[#EDEDED] bg-[#111111]'
                : 'border-transparent text-[#8C8C8C] hover:text-[#EDEDED] hover:bg-[#161616]'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className="ml-1 px-1.5 py-0.2 rounded-[3px] bg-[#1C1C1C] text-[10px] text-[#8C8C8C] font-mono">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Table components for enterprise density with hairline borders and right-aligned tabular numbers.
 */
export function Table({ children, className = '', id }) {
  return (
    <div className="w-full overflow-x-auto border border-[#242424] rounded-[6px]">
      <table id={id} className={`w-full text-left border-collapse text-[13px] ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <thead className={`bg-[#161616] text-[#8C8C8C] font-medium border-b border-[#242424] select-none text-[12px] uppercase tracking-wider ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return <tbody className={`divide-y divide-[#242424] bg-[#111111] ${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = '', isSelected = false, ...props }) {
  return (
    <tr
      className={`transition-colors duration-100 ${
        isSelected
          ? 'bg-[#FF6A1A]/10 text-[#EDEDED]'
          : 'hover:bg-[#161616] text-[#EDEDED]'
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', align = 'left', ...props }) {
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right tabular-nums',
  };
  return (
    <td
      className={`px-3.5 py-2.5 ${alignments[align] || alignments.left} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableHeaderCell({ children, className = '', align = 'left', ...props }) {
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  return (
    <th
      className={`px-3.5 py-2 font-medium ${alignments[align] || alignments.left} ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

/**
 * Skeleton loader with flat opacity pulse (no shimmer gradients).
 */
export function Skeleton({ className = '' }) {
  return <div className={`bg-[#1C1C1C] animate-pulse rounded-[4px] ${className}`} />;
}

/**
 * Keyboard shortcut badge.
 */
export function Kbd({ children }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#8C8C8C] bg-[#161616] border border-[#242424] rounded-[4px]">
      {children}
    </kbd>
  );
}

/**
 * EmptyState display.
 */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon && <div className="text-[#5E5E5E] mb-3">{icon}</div>}
      {title && <h4 className="text-[13px] font-medium text-[#EDEDED] mb-1">{title}</h4>}
      {description && <p className="text-[12px] text-[#8C8C8C] max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
