'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge.jsx';

/**
 * Lightweight, robust Markdown and formatted text renderer.
 * Converts headings, bold, bullet points, inline code, and line breaks into clean JSX.
 */
export function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;
  const str = String(content);

  const lines = str.split('\n');

  return (
    <div className={`space-y-1.5 text-[12px] leading-relaxed text-[#EDEDED] ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-[12px] font-semibold text-[#FF6A1A] mt-2 mb-1">
              {trimmed.slice(4)}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-[13px] font-bold text-[#EDEDED] mt-2.5 mb-1 border-b border-[#242424] pb-1">
              {trimmed.slice(3)}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-[14px] font-bold text-[#FF6A1A] mt-3 mb-1.5">
              {trimmed.slice(2)}
            </h2>
          );
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[#FF6A1A] font-bold">•</span>
              <span>{renderInlineFormatting(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-mono text-[#8C8C8C] text-[11px] shrink-0">{numMatch[1]}.</span>
              <span>{renderInlineFormatting(numMatch[2])}</span>
            </div>
          );
        }

        // Alert / notice callout
        if (trimmed.startsWith('⚠️') || trimmed.startsWith('✓') || trimmed.startsWith('✕')) {
          const isSuccess = trimmed.includes('✓') || trimmed.toLowerCase().includes('success') || trimmed.toLowerCase().includes('created');
          const isError = trimmed.includes('✕') || trimmed.toLowerCase().includes('fail') || trimmed.toLowerCase().includes('error');
          return (
            <div
              key={idx}
              className={`p-2 rounded-[4px] border my-1 text-[12px] flex items-start gap-2 ${
                isSuccess
                  ? 'bg-[#3FB950]/10 border-[#3FB950]/30 text-[#3FB950]'
                  : isError
                  ? 'bg-[#F85149]/10 border-[#F85149]/30 text-[#F85149]'
                  : 'bg-[#D29922]/10 border-[#D29922]/30 text-[#D29922]'
              }`}
            >
              <span>{trimmed}</span>
            </div>
          );
        }

        return <div key={idx}>{renderInlineFormatting(trimmed)}</div>;
      })}
    </div>
  );
}

/**
 * Inline formatter for bold, code, and links.
 */
function renderInlineFormatting(text) {
  if (!text) return '';
  // Split on bold (`**text**`) or code (`` `code` ``)
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-[#EDEDED]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="font-mono bg-[#1C1C1C] text-[#FF6A1A] px-1 py-0.5 rounded text-[11px]">
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Formats Playwright Accessibility Snapshot strings into a structured, readable view.
 */
function FormattedSnapshotView({ snapshotText }) {
  if (!snapshotText) return null;

  // Parse lines
  const lines = snapshotText.split('\n');
  let currentSection = 'header';
  const headerLines = [];
  const alertLines = [];
  const headingLines = [];
  const elementLines = [];
  const otherLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('[ACTIVE ALERTS & ERROR NOTICES]')) {
      currentSection = 'alerts';
      continue;
    }
    if (trimmed.startsWith('[PAGE HEADINGS]')) {
      currentSection = 'headings';
      continue;
    }
    if (trimmed.startsWith('[INTERACTIVE ELEMENTS]')) {
      currentSection = 'elements';
      continue;
    }

    if (currentSection === 'header') {
      headerLines.push(trimmed);
    } else if (currentSection === 'alerts') {
      alertLines.push(trimmed);
    } else if (currentSection === 'headings') {
      headingLines.push(trimmed.replace(/^[-•]\s*/, ''));
    } else if (currentSection === 'elements') {
      elementLines.push(trimmed);
    } else {
      otherLines.push(trimmed);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 font-sans text-[12px]">
      {/* Page Title & URL */}
      {headerLines.length > 0 && (
        <div className="bg-[#111111] p-2.5 rounded-[4px] border border-[#242424] space-y-1">
          {headerLines.map((h, i) => {
            const [k, ...v] = h.split(': ');
            return (
              <div key={i} className="flex items-baseline gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#8C8C8C] shrink-0">
                  {k}:
                </span>
                <span className="text-[#EDEDED] font-mono text-[11px] truncate">{v.join(': ')}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Alerts & Notices */}
      {alertLines.length > 0 && (
        <div className="p-2.5 rounded-[4px] bg-[#3FB950]/10 border border-[#3FB950]/30 text-[#EDEDED]">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[#3FB950] mb-1">
            Active Notice
          </div>
          {alertLines.map((alert, i) => (
            <div key={i} className="text-[12px] text-[#3FB950] font-medium leading-relaxed">
              {alert}
            </div>
          ))}
        </div>
      )}

      {/* Page Headings */}
      {headingLines.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[#8C8C8C] mb-1">
            Page Headings
          </div>
          <div className="flex flex-wrap gap-1.5">
            {headingLines.map((h, i) => (
              <span key={i} className="px-2 py-0.5 rounded-[4px] bg-[#161616] border border-[#242424] text-[#EDEDED] text-[11px]">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Elements */}
      {elementLines.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-[#8C8C8C] mb-1">
            <span>Available Interactive Elements</span>
            <span className="font-mono text-[#5E5E5E]">{elementLines.length} elements</span>
          </div>
          <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto pr-1">
            {elementLines.map((elLine, i) => {
              // Format: [e1] link "← All Bills" or [e3] button "Submit"
              const match = elLine.match(/^(\[e\d+\])\s+(\w+)\s+(.*)$/);
              if (match) {
                const [, ref, role, label] = match;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-1.5 rounded-[4px] bg-[#161616] border border-[#242424] text-[11px] font-mono hover:border-[#333333]"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-[#FF6A1A]/10 text-[#FF6A1A] font-bold border border-[#FF6A1A]/30">
                      {ref}
                    </span>
                    <span className="text-[#8C8C8C] text-[10px] uppercase">{role}</span>
                    <span className="text-[#EDEDED] truncate font-sans text-[12px]">{label}</span>
                  </div>
                );
              }
              return (
                <div key={i} className="p-1 rounded bg-[#161616] text-[#8C8C8C] font-mono text-[11px]">
                  {elLine}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main FormattedOutput component for StepCard.
 * Intelligently displays execution output in structured, human-readable format.
 */
export function FormattedOutput({ data, label = 'Execution Output' }) {
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' | 'raw'

  if (data === undefined || data === null) return null;

  // Mask sensitive credentials
  const maskSecrets = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/\{\{secret:([A-Za-z0-9_]+)\}\}/g, '••••••••');
  };

  const isObject = typeof data === 'object';
  const hasSnapshot = isObject && typeof data.snapshot === 'string';

  // Check if object is key-value map (like extracted invoice fields or record)
  const isKeyValueMap = isObject && !hasSnapshot && !Array.isArray(data);

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {/* Header bar with Mode Switcher */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#5E5E5E] font-medium uppercase tracking-wider">{label}:</span>
        <div className="flex items-center gap-1 bg-[#111111] p-0.5 rounded border border-[#242424]">
          <button
            type="button"
            onClick={() => setViewMode('formatted')}
            className={`px-2 py-0.5 rounded-[3px] text-[10px] font-medium transition-colors cursor-pointer ${
              viewMode === 'formatted'
                ? 'bg-[#1C1C1C] text-[#FF6A1A]'
                : 'text-[#8C8C8C] hover:text-[#EDEDED]'
            }`}
          >
            Formatted
          </button>
          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`px-2 py-0.5 rounded-[3px] text-[10px] font-mono transition-colors cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-[#1C1C1C] text-[#FF6A1A]'
                : 'text-[#8C8C8C] hover:text-[#EDEDED]'
            }`}
          >
            Raw JSON
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-[#161616] border border-[#242424] p-3 rounded-[6px]">
        {viewMode === 'raw' ? (
          <pre className="font-mono text-[11px] text-[#8C8C8C] overflow-x-auto whitespace-pre-wrap max-h-[300px]">
            {isObject ? maskSecrets(JSON.stringify(data, null, 2)) : String(data)}
          </pre>
        ) : (
          <div>
            {/* Case 1: Browser Action Output with Snapshot */}
            {hasSnapshot && (
              <div className="space-y-3">
                {/* Action Metadata Row */}
                <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-[#242424]">
                  {data.clickedRef && (
                    <Badge variant="warning" size="sm">
                      Clicked: [{data.clickedRef}]
                    </Badge>
                  )}
                  {data.typedRef && (
                    <Badge variant="warning" size="sm">
                      Typed: [{data.typedRef}]
                    </Badge>
                  )}
                  {data.currentUrl && (
                    <span className="text-[11px] font-mono text-[#8C8C8C] truncate">
                      Navigated: <span className="text-[#FF6A1A]">{data.currentUrl}</span>
                    </span>
                  )}
                </div>

                {/* Structured Snapshot View */}
                <FormattedSnapshotView snapshotText={data.snapshot} />
              </div>
            )}

            {/* Case 2: Structured Key-Value Data (e.g. extracted PDF fields or DB records) */}
            {isKeyValueMap && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(data).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2 rounded-[4px] bg-[#111111] border border-[#242424] flex flex-col gap-0.5"
                  >
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#8C8C8C]">
                      {key}
                    </span>
                    <span className="text-[12px] font-mono text-[#EDEDED] font-medium break-all">
                      {typeof val === 'object' && val !== null
                        ? JSON.stringify(val)
                        : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Case 3: Array of items (e.g. invoices list or log entries) */}
            {Array.isArray(data) && (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                {data.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-[4px] bg-[#111111] border border-[#242424] text-[12px] font-mono text-[#EDEDED]"
                  >
                    {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                  </div>
                ))}
              </div>
            )}

            {/* Case 4: Plain string or Markdown */}
            {!isObject && (
              <MarkdownRenderer content={String(data)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
