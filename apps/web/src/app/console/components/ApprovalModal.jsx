'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';

/**
 * Centered modal for Human-in-the-Loop policy gate approval with live inline editing.
 */
export function ApprovalModal({
  isOpen,
  payload,
  onApprove,
  onReject,
  onOpenScreenshot,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState({});

  useEffect(() => {
    const vals = payload?.currentFormValues || payload?.values || {};
    setEditedValues({ ...vals });
  }, [payload]);

  if (!isOpen || !payload) return null;

  const handleFieldChange = (key, val) => {
    setEditedValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleApprove = () => {
    const baseVals = payload?.currentFormValues || payload?.values || {};
    onApprove(isEditing ? editedValues : baseVals);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85"
    >
      <div className="w-full max-w-lg bg-[#111111] border border-[#333333] rounded-[8px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#242424] bg-[#161616] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A1A] animate-dot-pulse" />
            <h3 className="text-[14px] font-semibold text-[#EDEDED] tracking-tight">
              Approval required
            </h3>
          </div>
          <Badge variant="warning" size="sm">
            {payload.risk || 'High Risk Action'}
          </Badge>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          <p className="text-[13px] text-[#EDEDED] leading-relaxed">
            {payload.summary ||
              'The agent intends to execute a state-changing write action in the company system.'}
          </p>

          {/* Values Table */}
          <div className="border border-[#242424] rounded-[6px] overflow-hidden bg-[#161616]">
            <div className="px-3.5 py-2 bg-[#1C1C1C] border-b border-[#242424] text-[11px] font-medium uppercase tracking-wider text-[#8C8C8C] flex items-center justify-between">
              <span>Field Values</span>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-[11px] text-[#FF6A1A] hover:underline cursor-pointer"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Values'}
              </button>
            </div>

            <div className="divide-y divide-[#242424]">
              {Object.entries(editedValues).length === 0 ? (
                <div className="px-3.5 py-3 text-[12px] text-[#8C8C8C] italic text-center">
                  No editable form fields detected on current page.
                </div>
              ) : (
                Object.entries(editedValues).map(([k, v]) => (
                  <div key={k} className="px-3.5 py-2 flex items-center justify-between gap-3 text-[12px]">
                    <span className="font-mono text-[#8C8C8C] shrink-0 text-left max-w-[45%] truncate" title={k}>
                      {k}
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={v ?? ''}
                        onChange={(e) => handleFieldChange(k, e.target.value)}
                        className="bg-[#111111] text-[#EDEDED] font-mono text-[12px] px-2 py-1 rounded-[4px] border border-[#333333] focus:border-[#FF6A1A] focus:outline-none w-3/5 text-right"
                      />
                    ) : (
                      <span className="font-mono text-[#EDEDED] font-semibold text-right break-all">
                        {String(v)}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Screenshot Evidence Preview */}
          {payload.evidence && (
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#8C8C8C] font-semibold block mb-1.5">
                Supporting Evidence
              </span>
              <div
                onClick={() => onOpenScreenshot && onOpenScreenshot(payload.evidence)}
                className="relative border border-[#242424] rounded-[6px] overflow-hidden group cursor-pointer max-h-40"
              >
                <img
                  src={payload.evidence}
                  alt="Approval Evidence"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[12px] text-white font-mono transition-opacity">
                  Click to enlarge screenshot
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#242424] bg-[#161616] flex items-center justify-end gap-2.5">
          <Button
            variant="danger"
            size="sm"
            onClick={onReject}
          >
            Reject
          </Button>

          {isEditing ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleApprove}
            >
              Approve with edits
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleApprove}
            >
              Approve action
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
