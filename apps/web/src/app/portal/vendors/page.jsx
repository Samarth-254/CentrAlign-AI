import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isPortalAuthenticated } from '@/lib/auth';
import { getDb } from '@/lib/db';

export default async function VendorsPage() {
  const authed = await isPortalAuthenticated();
  if (!authed) {
    redirect('/portal/login?returnUrl=/portal/vendors');
  }

  const db = getDb();
  const vendors = db.prepare('SELECT * FROM vendors ORDER BY name ASC').all();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white shadow-md">
            VP
          </div>
          <div>
            <h1 className="font-semibold text-lg text-white">Vendor Portal</h1>
            <p className="text-xs text-slate-400">CentrAlign Third-Party Supplier Network</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-md">
            ops@acme.test
          </span>
          <a
            href="/portal/api/logout"
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            Sign out
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Active Vendors</h2>
            <p className="text-sm text-slate-400 mt-1">
              Select a vendor company to view, inspect, and download issued commercial invoices.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((vendor) => {
            const invoiceCountRow = db
              .prepare('SELECT count(*) as count FROM invoices WHERE vendor_id = ?')
              .get(vendor.id);
            const count = invoiceCountRow ? invoiceCountRow.count : 0;

            return (
              <div
                key={vendor.id}
                className="bg-slate-800/60 border border-slate-700/80 hover:border-sky-500/50 rounded-xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{vendor.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {count} Invoices
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Vendor ID: {vendor.id}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-end">
                  <Link
                    href={`/portal/vendors/${vendor.id}/invoices`}
                    className="inline-flex items-center text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
                    id={`view-vendor-${vendor.slug}`}
                    aria-label={`View Invoices for ${vendor.name}`}
                  >
                    View Invoices &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
