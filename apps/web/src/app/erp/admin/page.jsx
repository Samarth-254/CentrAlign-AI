import Link from 'next/link';
import { isErpAuthenticated } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function ErpAdminPage({ searchParams }) {
  const authed = await isErpAuthenticated();
  if (!authed) {
    redirect('/erp/login?returnUrl=/erp/admin');
  }

  const sParams = await searchParams;
  const isReset = sParams?.reset === 'true';
  const isUpdated = sParams?.updated === 'true';

  const db = getDb();
  const chaosSetting = db.prepare("SELECT value FROM settings WHERE key = 'chaos_enabled'").get();
  const isChaos = chaosSetting?.value === 'true';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] flex flex-col font-sans select-none">
      {/* Header */}
      <header className="h-12 border-b border-[#242424] bg-[#0A0A0A] px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/erp/bills" className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-[#FF6A1A] rounded-[3px]" />
            <span className="text-[14px] font-semibold text-[#EDEDED] tracking-tight">
              AcmeBooks
            </span>
          </Link>
          <span className="text-[#333333]">/</span>
          <Link href="/erp/bills" className="text-[12px] text-[#8C8C8C] hover:text-[#EDEDED]">
            ← Bills
          </Link>
          <span className="text-[#333333]">/</span>
          <h1 className="text-[12px] font-medium text-[#EDEDED]">Admin & Reliability Control</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#8C8C8C] bg-[#161616] px-2 py-0.5 rounded-[4px] border border-[#242424]">
            finance@acme.test
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full px-6 py-8 flex-1">
        <div className="mb-6">
          <h2 className="text-[20px] font-semibold text-[#EDEDED] tracking-tight">
            Reliability & Sandbox Administration
          </h2>
          <p className="text-[12px] text-[#8C8C8C] mt-0.5">
            Configure transient failure simulation and reset deterministic test fixtures.
          </p>
        </div>

        {isReset && (
          <div role="status" className="mb-6 p-3 rounded-[6px] bg-[#3FB950]/10 border border-[#3FB950]/30 text-[#3FB950] text-[12px]">
            ✓ Sandbox database and generated invoice PDFs re-seeded to pristine baseline.
          </div>
        )}

        {isUpdated && (
          <div role="status" className="mb-6 p-3 rounded-[6px] bg-[#1C1C1C] border border-[#242424] text-[#EDEDED] text-[12px]">
            ✓ Reliability configuration settings updated.
          </div>
        )}

        <div className="space-y-4">
          {/* Chaos Mode Card */}
          <div className="bg-[#111111] border border-[#242424] rounded-[6px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[14px] font-semibold text-[#EDEDED]">
                  Chaos Mode (Transient 500 Simulation)
                </h3>
                <p className="text-[12px] text-[#8C8C8C] mt-1 max-w-lg leading-relaxed">
                  When enabled, the first attempt to submit any new bill returns a transient HTTP 500 &quot;Service temporarily unavailable. Please retry.&quot; error. The second attempt succeeds. Tests the agent&apos;s ability to reflect, backoff, and retry.
                </p>
                <div className="mt-3">
                  <span
                    id="chaos-status-indicator"
                    className={`inline-block px-2 py-0.5 rounded-[4px] text-[11px] font-mono border ${
                      isChaos
                        ? 'bg-[#D29922]/10 border-[#D29922]/30 text-[#D29922]'
                        : 'bg-[#161616] border-[#242424] text-[#8C8C8C]'
                    }`}
                  >
                    Status: {isChaos ? 'CHAOS ACTIVE' : 'NORMAL (No Failures)'}
                  </span>
                </div>
              </div>

              <form action="/api/chaos" method="POST">
                <input type="hidden" name="enabled" value={isChaos ? 'false' : 'true'} />
                <button
                  type="submit"
                  id="toggle-chaos-button"
                  className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer border ${
                    isChaos
                      ? 'bg-[#FF6A1A] border-[#FF6A1A] text-[#0A0A0A] font-semibold'
                      : 'bg-[#161616] border-[#242424] hover:border-[#333333] text-[#EDEDED]'
                  }`}
                >
                  {isChaos ? 'Disable Chaos Mode' : 'Enable Chaos Mode'}
                </button>
              </form>
            </div>
          </div>

          {/* Reset Demo Data Card */}
          <div className="bg-[#111111] border border-[#242424] rounded-[6px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[14px] font-semibold text-[#EDEDED]">
                  Reset Sandbox Data
                </h3>
                <p className="text-[12px] text-[#8C8C8C] mt-1 max-w-lg leading-relaxed">
                  Re-runs the deterministic seed script: cleans bills ledger, resets vendor invoices, regenerates all 34 PDFs with strict formatting, and prepares test states for T1 - T7 tasks.
                </p>
              </div>

              <form action="/api/reset" method="POST">
                <button
                  type="submit"
                  id="reset-db-button"
                  className="px-3 py-1.5 bg-[#161616] border border-[#F85149]/40 hover:bg-[#F85149]/10 text-[#F85149] rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer"
                >
                  Reset Demo Data
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1C1C1C] py-4 text-center text-[11px] text-[#5E5E5E]">
        AcmeBooks Financial Ledger • Internal System of Record
      </footer>
    </div>
  );
}
