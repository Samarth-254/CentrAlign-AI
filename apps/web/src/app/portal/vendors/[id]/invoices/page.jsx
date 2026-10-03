import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { isPortalAuthenticated } from '@/lib/auth';
import { getDb } from '@/lib/db';

export default async function VendorInvoicesPage({ params, searchParams }) {
  const authed = await isPortalAuthenticated();
  const routeParams = await params;
  const sParams = await searchParams;
  const vendorId = routeParams.id;

  if (!authed) {
    redirect(`/portal/login?returnUrl=/portal/vendors/${vendorId}/invoices`);
  }

  const db = getDb();
  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(vendorId);
  if (!vendor) {
    notFound();
  }

  const page = Math.max(1, parseInt(sParams?.page || '1', 10));
  const pageSize = 5;
  const offset = (page - 1) * pageSize;

  const totalCountRow = db
    .prepare('SELECT count(*) as count FROM invoices WHERE vendor_id = ?')
    .get(vendorId);
  const totalCount = totalCountRow ? totalCountRow.count : 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // CRITICAL REQUIREMENT: Sorted by invoice_no, NOT by date, so "latest" requires reading dates
  const invoices = db
    .prepare('SELECT * FROM invoices WHERE vendor_id = ? ORDER BY invoice_no ASC LIMIT ? OFFSET ?')
    .all(vendorId, pageSize, offset);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center space-x-3">
          <Link
            href="/portal/vendors"
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
          >
            <span>&larr; All Vendors</span>
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="font-semibold text-lg text-white">{vendor.name} Invoices</h1>
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

      {/* Main Table */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{vendor.name}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Showing invoices (Sorted alphabetically by Invoice No). Page {page} of {totalPages}
            </p>
          </div>
          <div className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3 py-2 rounded-lg">
            Note: Table order is strictly by Invoice Number, not Issue Date.
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg">
          <table className="min-w-full divide-y divide-slate-700/80 text-left text-sm" id="invoices-table">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th scope="col" className="px-6 py-3.5">Invoice No</th>
                <th scope="col" className="px-6 py-3.5">Issue Date</th>
                <th scope="col" className="px-6 py-3.5">Due Date</th>
                <th scope="col" className="px-6 py-3.5">Status</th>
                <th scope="col" className="px-6 py-3.5 text-right">Amount</th>
                <th scope="col" className="px-6 py-3.5 text-right">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-200">
              {invoices.map((inv) => {
                const statusColor =
                  inv.status === 'Issued'
                    ? 'bg-sky-950 text-sky-300 border-sky-800'
                    : inv.status === 'Paid'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : inv.status === 'Draft'
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700';

                const formattedAmount =
                  inv.currency === 'INR'
                    ? `INR ${inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    : `$${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                return (
                  <tr key={inv.id} className="hover:bg-slate-750/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-white">{inv.invoice_no}</td>
                    <td className="px-6 py-4 text-slate-300">{inv.issue_date}</td>
                    <td className="px-6 py-4 text-slate-400">{inv.due_date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-white">
                      {formattedAmount}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/invoices/${inv.pdf_filename}`}
                        download={inv.pdf_filename}
                        className="inline-flex items-center px-3 py-1.5 border border-slate-600 rounded-md text-xs font-medium text-sky-400 bg-slate-900/60 hover:bg-slate-800 hover:text-sky-300 hover:border-sky-500 transition-colors"
                        id={`download-${inv.invoice_no.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      >
                        Download PDF ({inv.invoice_no})
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="bg-slate-950/40 px-6 py-3.5 border-t border-slate-700/80 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-200">{offset + 1}</span> to{' '}
              <span className="font-semibold text-slate-200">{Math.min(offset + pageSize, totalCount)}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalCount}</span> invoices
            </div>
            <div className="flex space-x-2">
              {page > 1 ? (
                <Link
                  href={`/portal/vendors/${vendorId}/invoices?page=${page - 1}`}
                  className="px-3 py-1.5 rounded border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                  id="pagination-prev"
                >
                  &larr; Previous page
                </Link>
              ) : (
                <span className="px-3 py-1.5 rounded border border-slate-800 text-xs font-medium text-slate-600 cursor-not-allowed">
                  &larr; Previous page
                </span>
              )}

              {page < totalPages ? (
                <Link
                  href={`/portal/vendors/${vendorId}/invoices?page=${page + 1}`}
                  className="px-3 py-1.5 rounded border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                  id="pagination-next"
                >
                  Next page &rarr;
                </Link>
              ) : (
                <span className="px-3 py-1.5 rounded border border-slate-800 text-xs font-medium text-slate-600 cursor-not-allowed">
                  Next page &rarr;
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
