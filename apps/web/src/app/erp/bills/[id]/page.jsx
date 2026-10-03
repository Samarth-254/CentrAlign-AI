import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isErpAuthenticated } from '@/lib/auth';
import { getDb } from '@/lib/db';

export default async function BillDetailPage({ params, searchParams }) {
  const authed = await isErpAuthenticated();
  const { id } = await params;
  const sParams = await searchParams;

  if (!authed) {
    redirect(`/erp/login?returnUrl=/erp/bills/${id}`);
  }

  const db = getDb();
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);

  if (!bill) {
    notFound();
  }

  const isJustCreated = sParams?.created === 'true';
  const isJustPaid = sParams?.paid === 'true';

  const formattedAmount =
    bill.currency === 'INR'
      ? `INR ${bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      : `$${bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center space-x-3">
          <Link href="/erp/bills" className="text-xs text-slate-400 hover:text-white flex items-center space-x-1">
            <span>&larr; All Bills</span>
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="font-semibold text-lg text-white">Bill: {bill.invoice_no}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-md">
            finance@acme.test
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Success Banner when Bill Created */}
        {isJustCreated && (
          <div
            role="status"
            id="bill-created-banner"
            className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-100 shadow-lg flex items-center space-x-3"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h3 className="font-semibold text-emerald-200">Bill created</h3>
              <p className="text-xs text-emerald-300/90 mt-0.5">
                The payable bill record was successfully saved and registered in AcmeBooks ledger.
              </p>
            </div>
          </div>
        )}

        {/* Success Banner when Paid */}
        {isJustPaid && (
          <div
            role="status"
            id="bill-paid-banner"
            className="mb-6 p-4 rounded-xl bg-sky-950/80 border border-sky-700 text-sky-100 shadow-lg flex items-center space-x-3"
          >
            <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h3 className="font-semibold text-sky-200">Payment Status Updated</h3>
              <p className="text-xs text-sky-300/90 mt-0.5">
                The bill has been marked as Paid in AcmeBooks.
              </p>
            </div>
          </div>
        )}

        {/* Bill Record Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Internal Record ID: {bill.id}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{bill.vendor_name}</h2>
            </div>
            <div>
              <span
                id="bill-status-badge"
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                  bill.status === 'Paid'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}
              >
                {bill.status}
              </span>
            </div>
          </div>

          <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice Number</span>
              <p className="font-mono text-base font-semibold text-white mt-1" id="detail-invoice-no">
                {bill.invoice_no}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Amount</span>
              <p className="font-mono text-xl font-bold text-emerald-400 mt-1" id="detail-amount">
                {formattedAmount}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice Date</span>
              <p className="text-slate-200 mt-1" id="detail-invoice-date">
                {bill.invoice_date}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date</span>
              <p className="text-slate-200 mt-1" id="detail-due-date">
                {bill.due_date}
              </p>
            </div>

            <div className="md:col-span-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes & Remittance</span>
              <p className="text-slate-300 mt-1 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                {bill.notes || 'No notes entered.'}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Created At</span>
              <p className="text-xs text-slate-500 mt-1">{bill.created_at}</p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
            <Link
              href="/erp/bills"
              className="text-xs text-slate-400 hover:text-white underline"
            >
              &larr; Back to bills list
            </Link>

            {bill.status !== 'Paid' && (
              <form action={`/erp/api/bills/${bill.id}/pay`} method="POST">
                <button
                  type="submit"
                  id="mark-as-paid-button"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Mark as Paid
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
