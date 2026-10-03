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

  // CRITICAL REQUIREMENT: Sorted by invoice_no, NOT by date
  const invoices = db
    .prepare('SELECT * FROM invoices WHERE vendor_id = ? ORDER BY invoice_no ASC LIMIT ? OFFSET ?')
    .all(vendorId, pageSize, offset);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] flex flex-col font-sans select-none">
      {/* Header */}
      <header className="h-12 border-b border-[#242424] bg-[#0A0A0A] px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/portal/vendors" className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-[#FF6A1A] rounded-[3px]" />
            <span className="text-[14px] font-semibold text-[#EDEDED] tracking-tight">
              VendorHub
            </span>
          </Link>
          <span className="text-[#333333]">/</span>
          <Link
            href="/portal/vendors"
            className="text-[12px] text-[#8C8C8C] hover:text-[#EDEDED]"
          >
            ← All Vendors
          </Link>
          <span className="text-[#333333]">/</span>
          <span className="text-[12px] text-[#EDEDED] font-medium">{vendor.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#8C8C8C] bg-[#161616] px-2 py-0.5 rounded-[4px] border border-[#242424]">
            ops@acme.test
          </span>
          <a
            href="/portal/api/logout"
            className="text-[12px] text-[#8C8C8C] hover:text-[#EDEDED] transition-colors"
          >
            Sign out
          </a>
        </div>
      </header>

      {/* Main Table Container */}
      <main className="max-w-5xl mx-auto w-full px-6 py-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h2 className="text-[20px] font-semibold text-[#EDEDED] tracking-tight">
              {vendor.name} Invoices
            </h2>
            <p className="text-[12px] font-mono text-[#8C8C8C] mt-1">
              Table sorted alphabetically by Invoice No. Page {page} of {totalPages}
            </p>
          </div>

          <div className="text-[11px] font-mono text-[#D29922] bg-[#D29922]/10 border border-[#D29922]/20 px-3 py-1.5 rounded-[4px]">
            Sorted by invoice number, not issue date.
          </div>
        </div>

        {/* Invoice Table */}
        <div className="border border-[#242424] rounded-[6px] overflow-hidden bg-[#111111]">
          <table className="w-full text-left border-collapse text-[13px]" id="invoices-table">
            <thead className="bg-[#161616] text-[#8C8C8C] text-[11px] uppercase tracking-wider font-medium border-b border-[#242424] select-none sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Invoice No</th>
                <th className="px-4 py-2.5">Issue Date</th>
                <th className="px-4 py-2.5">Due Date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5 text-right">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424] text-[#EDEDED]">
              {invoices.map((inv) => {
                const statusStyles = {
                  Issued: 'bg-[#FF6A1A]/10 text-[#FF6A1A] border-[#FF6A1A]/20',
                  Paid: 'bg-[#3FB950]/10 text-[#3FB950] border-[#3FB950]/20',
                  Draft: 'bg-[#D29922]/10 text-[#D29922] border-[#D29922]/20',
                  Void: 'bg-[#1C1C1C] text-[#5E5E5E] border-[#242424]',
                };

                const formattedAmount =
                  inv.currency === 'INR'
                    ? `INR ${inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    : `$${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                return (
                  <tr key={inv.id} className="hover:bg-[#161616] transition-colors">
                    <td className="px-4 py-2.5 font-mono font-medium text-[#EDEDED]">
                      {inv.invoice_no}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-[#8C8C8C]">
                      {inv.issue_date}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-[#8C8C8C]">
                      {inv.due_date}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-[3px] text-[11px] font-mono border ${
                          statusStyles[inv.status] || 'bg-[#161616] text-[#8C8C8C]'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-[#EDEDED] tabular-nums">
                      {formattedAmount}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <a
                        href={`/invoices/${inv.pdf_filename}`}
                        download={inv.pdf_filename}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-mono font-medium text-[#EDEDED] bg-[#161616] border border-[#242424] hover:border-[#FF6A1A] hover:text-[#FF6A1A] transition-colors"
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
          <div className="bg-[#161616] px-4 py-3 border-t border-[#242424] flex items-center justify-between">
            <div className="text-[12px] font-mono text-[#8C8C8C]">
              Showing {offset + 1} - {Math.min(offset + pageSize, totalCount)} of {totalCount} invoices
            </div>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={`/portal/vendors/${vendorId}/invoices?page=${page - 1}`}
                  className="px-2.5 py-1 rounded-[4px] border border-[#242424] bg-[#111111] hover:bg-[#1C1C1C] text-[12px] text-[#EDEDED] transition-colors"
                  id="pagination-prev"
                >
                  ← Previous page
                </Link>
              ) : (
                <span className="px-2.5 py-1 rounded-[4px] border border-[#1C1C1C] text-[12px] text-[#5E5E5E] cursor-not-allowed">
                  ← Previous page
                </span>
              )}

              {page < totalPages ? (
                <Link
                  href={`/portal/vendors/${vendorId}/invoices?page=${page + 1}`}
                  className="px-2.5 py-1 rounded-[4px] border border-[#242424] bg-[#111111] hover:bg-[#1C1C1C] text-[12px] text-[#EDEDED] transition-colors"
                  id="pagination-next"
                >
                  Next page →
                </Link>
              ) : (
                <span className="px-2.5 py-1 rounded-[4px] border border-[#1C1C1C] text-[12px] text-[#5E5E5E] cursor-not-allowed">
                  Next page →
                </span>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1C1C1C] py-4 text-center text-[11px] text-[#5E5E5E]">
        VendorHub External Supplier Network • Simulated Environment
      </footer>
    </div>
  );
}
