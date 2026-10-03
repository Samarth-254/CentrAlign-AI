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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center space-x-3">
          <Link href="/erp/bills" className="text-xs text-slate-400 hover:text-white flex items-center space-x-1">
            <span>&larr; Bills</span>
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="font-semibold text-lg text-white">AcmeBooks Admin & Reliability Control</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-md">
            finance@acme.test
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">System Reliability & Sandbox Testing</h2>
          <p className="text-sm text-slate-400 mt-1">
            Simulate transient network/server failures and re-initialize sandbox data for reproducible task worker evaluations.
          </p>
        </div>

        {isReset && (
          <div role="status" className="mb-6 p-4 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-sm">
            ✓ Sandbox database and generated invoice PDFs have been re-seeded to pristine baseline.
          </div>
        )}

        {isUpdated && (
          <div role="status" className="mb-6 p-4 rounded-xl bg-sky-950/70 border border-sky-700 text-sky-200 text-sm">
            ✓ Reliability configuration settings updated.
          </div>
        )}

        <div className="space-y-6">
          {/* Chaos Mode Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Chaos Mode (Transient 500 Simulation)</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-xl">
                  When enabled, the first attempt to submit any new bill returns a transient HTTP 500 &quot;Service temporarily unavailable. Please retry.&quot; error. The second attempt automatically succeeds. Tests the agent&apos;s ability to reflect, backoff, and retry.
                </p>
                <div className="mt-3">
                  <span
                    id="chaos-status-indicator"
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                      isChaos
                        ? 'bg-amber-950 border border-amber-800 text-amber-300'
                        : 'bg-slate-800 border border-slate-700 text-slate-400'
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
                  className={`px-4 py-2 rounded-lg font-medium text-xs shadow-sm transition-colors ${
                    isChaos
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isChaos ? 'Disable Chaos Mode' : 'Enable Chaos Mode'}
                </button>
              </form>
            </div>
          </div>

          {/* Reset Demo Data Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Reset Sandbox Data</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-xl">
                  Re-runs the deterministic seed script: cleans all bills, resets invoices and vendor tables, regenerates all 34 PDFs with strict formatting, and prepares test states for T1 - T7 tasks.
                </p>
              </div>

              <form action="/api/reset" method="POST">
                <button
                  type="submit"
                  id="reset-db-button"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Reset Demo Data
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
