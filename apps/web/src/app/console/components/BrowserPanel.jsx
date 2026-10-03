'use client';

/**
 * BrowserPanel showing "Agent's View" in real time:
 * Address bar with current URL in mono, and live full-width screenshot.
 */
export function BrowserPanel({ currentUrl = 'about:blank', screenshot = null, onEnlarge }) {
  return (
    <div className="flex flex-col h-full bg-[#111111] overflow-hidden">
      {/* Address Bar */}
      <div className="p-2.5 bg-[#161616] border-b border-[#242424] flex items-center gap-2">
        <span className="text-[12px] text-[#5E5E5E] select-none">🌐</span>
        <div className="flex-1 bg-[#111111] border border-[#242424] px-2.5 py-1 rounded-[4px] text-[11px] font-mono text-[#8C8C8C] truncate">
          {currentUrl || 'about:blank'}
        </div>
      </div>

      {/* Viewport Frame */}
      <div className="flex-1 bg-[#0A0A0A] flex items-center justify-center p-3 overflow-hidden">
        {screenshot ? (
          <div className="relative group w-full h-full flex items-center justify-center">
            <img
              src={screenshot}
              alt="Agent Live View"
              className="max-w-full max-h-full object-contain rounded-[4px] border border-[#242424]"
            />
            {onEnlarge && (
              <button
                type="button"
                onClick={() => onEnlarge(screenshot)}
                className="absolute bottom-3 right-3 bg-[#161616]/90 border border-[#333333] hover:border-[#FF6A1A] text-[#EDEDED] text-[11px] font-mono px-2 py-1 rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                🔍 Enlarge
              </button>
            )}
          </div>
        ) : (
          <div className="text-center p-6 text-[12px] text-[#5E5E5E]">
            <p>No browser session active</p>
            <p className="text-[11px] mt-1 text-[#8C8C8C]">
              Screenshots captured during navigation will render here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
