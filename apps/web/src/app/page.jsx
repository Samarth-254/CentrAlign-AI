import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <header className="border-b border-slate-800/80 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
            CA
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white">CentrAlign AI</h1>
            <p className="text-xs text-slate-400">Autonomous Task Worker Architecture</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/console"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-semibold shadow-md transition-all"
          >
            Launch Console &rarr;
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-950/60 rounded-full border border-sky-800/50 mb-4">
            AI Engineering Prototype
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Autonomous Task Worker Sandbox & System
          </h2>
          <p className="mt-4 text-base text-slate-400">
            A state machine agent built on LangGraph.js that interacts with real browser UIs, extracts structured data from commercial PDFs, enforces deterministic policy gates, and independently verifies outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Agent Console */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4 font-bold">
                UI
              </div>
              <h3 className="text-lg font-semibold text-white">Agent Console</h3>
              <p className="text-xs text-slate-400 mt-2">
                Live SSE execution timeline, living plan checklists, memory inspection, human approval modals, and verification report audits.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link href="/console" className="text-sm font-medium text-sky-400 hover:text-sky-300">
                Open Console &rarr;
              </Link>
            </div>
          </div>

          {/* Card 2: Vendor Portal */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 font-bold">
                VP
              </div>
              <h3 className="text-lg font-semibold text-white">Vendor Portal</h3>
              <p className="text-xs text-slate-400 mt-2">
                Simulated 3rd-party supplier portal with 5 companies, paginated invoice tables, and downloadable multi-format PDFs.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link href="/portal/vendors" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
                Explore Portal &rarr;
              </Link>
            </div>
          </div>

          {/* Card 3: AcmeBooks ERP */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 font-bold">
                AB
              </div>
              <h3 className="text-lg font-semibold text-white">AcmeBooks ERP</h3>
              <p className="text-xs text-slate-400 mt-2">
                Internal enterprise accounting system with strict server validations, duplicate detection, chaos mode, and payment actions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link href="/erp/bills" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                Enter AcmeBooks &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 px-8 py-6 text-center text-xs text-slate-500">
        CentrAlign Task Worker Prototype &bull; JavaScript ESM &bull; LangGraph.js &bull; Playwright &bull; Google Gemini
      </footer>
    </div>
  );
}
