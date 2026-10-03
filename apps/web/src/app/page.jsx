import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] flex flex-col justify-between font-sans selection:bg-[#FF6A1A]/20 select-none">
      {/* Top Header */}
      <header className="h-12 border-b border-[#242424] px-6 flex items-center justify-between sticky top-0 z-20 bg-[#0A0A0A]">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 bg-[#FF6A1A] rounded-[3px]" />
          <span className="text-[14px] font-semibold text-[#EDEDED] tracking-tight">
            CentrAlign AI
          </span>
          <div className="h-4 w-px bg-[#242424]" />
          <span className="text-[12px] text-[#8C8C8C]">Autonomous Task Worker</span>
        </div>
        <div>
          <Link
            href="/console"
            className="px-3 py-1.5 bg-[#FF6A1A] hover:bg-[#FF7F3A] active:bg-[#E55A0F] text-[#0A0A0A] rounded-[6px] text-[12px] font-semibold transition-colors"
          >
            Launch Console →
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center">
        <div className="mb-12">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#161616] border border-[#242424] text-[11px] font-mono text-[#8C8C8C] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A1A]" />
            <span>Autonomous AI Task Worker Prototype</span>
          </div>
          <h1 className="text-[32px] sm:text-[38px] font-semibold text-[#EDEDED] tracking-tight leading-tight">
            Enterprise computer-use agent with deterministic safety & independent verification.
          </h1>
          <p className="mt-3 text-[14px] text-[#8C8C8C] max-w-2xl leading-relaxed">
            A state machine agent built on LangGraph.js that operates realistic web applications through Playwright accessibility trees, extracts structured fields from commercial invoices, and enforces human-in-the-loop policy gates.
          </p>
        </div>

        {/* 3 Main Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Console */}
          <div className="bg-[#111111] border border-[#242424] hover:border-[#333333] rounded-[6px] p-5 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono text-[#FF6A1A] bg-[#FF6A1A]/10 px-2 py-0.5 rounded-[3px] border border-[#FF6A1A]/20">
                  Worker Console
                </span>
                <span className="text-[11px] font-mono text-[#5E5E5E]">/console</span>
              </div>
              <h2 className="text-[15px] font-semibold text-[#EDEDED]">
                Agent Console
              </h2>
              <p className="text-[12px] text-[#8C8C8C] mt-1.5 leading-relaxed">
                Live SSE execution timeline, living plan checklists, memory inspection, human approval modals, and verification report audits.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#1C1C1C]">
              <Link
                href="/console"
                className="text-[12px] font-medium text-[#FF6A1A] hover:text-[#FF7F3A] transition-colors"
              >
                Open Console →
              </Link>
            </div>
          </div>

          {/* Vendor Portal */}
          <div className="bg-[#111111] border border-[#242424] hover:border-[#333333] rounded-[6px] p-5 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono text-[#8C8C8C] bg-[#161616] px-2 py-0.5 rounded-[3px] border border-[#242424]">
                  External System
                </span>
                <span className="text-[11px] font-mono text-[#5E5E5E]">/portal</span>
              </div>
              <h2 className="text-[15px] font-semibold text-[#EDEDED]">
                VendorHub Portal
              </h2>
              <p className="text-[12px] text-[#8C8C8C] mt-1.5 leading-relaxed">
                Simulated 3rd-party supplier portal with 5 companies, paginated invoice tables, and downloadable multi-format PDFs.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#1C1C1C]">
              <Link
                href="/portal/vendors"
                className="text-[12px] font-medium text-[#EDEDED] hover:text-white transition-colors"
              >
                Explore Portal →
              </Link>
            </div>
          </div>

          {/* AcmeBooks ERP */}
          <div className="bg-[#111111] border border-[#242424] hover:border-[#333333] rounded-[6px] p-5 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono text-[#8C8C8C] bg-[#161616] px-2 py-0.5 rounded-[3px] border border-[#242424]">
                  System of Record
                </span>
                <span className="text-[11px] font-mono text-[#5E5E5E]">/erp</span>
              </div>
              <h2 className="text-[15px] font-semibold text-[#EDEDED]">
                AcmeBooks ERP
              </h2>
              <p className="text-[12px] text-[#8C8C8C] mt-1.5 leading-relaxed">
                Internal enterprise accounting system with strict server validations, duplicate detection, chaos mode, and payment actions.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#1C1C1C]">
              <Link
                href="/erp/bills"
                className="text-[12px] font-medium text-[#EDEDED] hover:text-white transition-colors"
              >
                Enter AcmeBooks →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1C1C1C] px-6 py-4 text-center text-[11px] text-[#5E5E5E]">
        CentrAlign Task Worker Prototype • Plain JavaScript ESM • LangGraph.js • Playwright • Google Gemini
      </footer>
    </div>
  );
}
