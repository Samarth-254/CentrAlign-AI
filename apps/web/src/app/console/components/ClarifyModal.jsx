'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button.jsx';

/**
 * Clarification modal for ask_human interrupts.
 */
export function ClarifyModal({ isOpen, questionData, onAnswer }) {
  const [inputVal, setInputVal] = useState('');

  if (!isOpen || !questionData) return null;

  const handleSubmit = (text) => {
    const finalAnswer = text || inputVal;
    if (!finalAnswer.trim()) return;
    onAnswer(finalAnswer.trim());
    setInputVal('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85"
    >
      <div className="w-full max-w-md bg-[#111111] border border-[#333333] rounded-[8px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#242424] bg-[#161616] flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A1A] animate-dot-pulse" />
          <h3 className="text-[14px] font-semibold text-[#EDEDED] tracking-tight">
            Clarification required
          </h3>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          <p className="text-[13px] text-[#EDEDED] leading-relaxed">
            {questionData.question || 'The agent encountered an ambiguous state and requires operator input.'}
          </p>

          {/* Optional choice buttons if present */}
          {questionData.options && questionData.options.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[#8C8C8C] font-semibold">
                Suggested Options:
              </span>
              {questionData.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSubmit(opt)}
                  className="text-left p-2.5 rounded-[6px] bg-[#161616] border border-[#242424] hover:border-[#FF6A1A] text-[12px] text-[#EDEDED] transition-colors cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Free text input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-[#8C8C8C] font-semibold">
              Your Instructions:
            </label>
            <textarea
              rows={2}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. Use the Issued invoice only, ignore Draft..."
              className="w-full bg-[#161616] text-[#EDEDED] text-[13px] p-2.5 rounded-[6px] border border-[#242424] focus:border-[#FF6A1A] focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-[#242424] bg-[#161616] flex items-center justify-end gap-2">
          <Button
            variant="primary"
            size="sm"
            disabled={!inputVal.trim()}
            onClick={() => handleSubmit()}
          >
            Submit answer →
          </Button>
        </div>
      </div>
    </div>
  );
}
