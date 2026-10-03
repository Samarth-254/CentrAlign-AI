'use client';

import { useEffect } from 'react';

/**
 * Screenshot Lightbox with arrow key navigation and Escape key dismissal.
 */
export function ScreenshotLightbox({ screenshot, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    }
    if (screenshot) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [screenshot, onClose]);

  if (!screenshot) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 cursor-zoom-out"
    >
      <div
        className="relative max-w-5xl max-h-[90vh] bg-[#111111] border border-[#333333] rounded-[8px] overflow-hidden flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#161616] border-b border-[#242424]">
          <span className="text-[12px] font-mono text-[#8C8C8C]">Observation Proof</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C8C8C] hover:text-[#EDEDED] p-1 rounded hover:bg-[#1C1C1C] cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="p-3 bg-[#0A0A0A] flex items-center justify-center overflow-auto max-h-[80vh]">
          <img
            src={screenshot}
            alt="Expanded Observation"
            className="max-w-full max-h-full object-contain rounded-[4px] border border-[#242424]"
          />
        </div>
      </div>
    </div>
  );
}
