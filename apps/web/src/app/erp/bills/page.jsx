import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isErpAuthenticated } from '@/lib/auth';
import { getDb } from '@/lib/db';

export default async function ErpBillsPage() {
  const authed = await isErpAuthenticated();
  if (!authed) {
    redirect('/erp/login?returnUrl=/erp/bills');
  }

  const db = getDb();
  const bills = db.prepare('SELECT * FROM bills ORDER BY created_at DESC').all();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ERP Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
            AB
          </div>
          <div>
            <h1 className="font-semibold text-lg text-white">AcmeBooks</h1>
            <p className="text-xs text-slate-400">Enterprise Accounts Payable System</p>
          </div>
        </div>

        <nav className="flex items-center space-x-6">
          <Link href="/erp/bills" className="text-sm font-medium text-emerald-400">
            Bills
          </Link>
          <Link href="/erp/admin" className="text-sm font-medium text-slate-400 hover:text-white">
            Admin & Chaos
          </Link>
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
            <span className="text-xs px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-md">
              finance@acme.test
            </span>
            <a href="/erp/api/logout" className="text-xs text-rose-400 hover:text-rose-300">
              Sign out
            </a>
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Accounts Payable Bills</h2>
            <p className="text-xs text-slate-400 mt-1">
              Internal ledger of vendor invoices registered for payment processing
            </p>
          </div>
          <div>
            <Link
              href="/erp/bills/new"
              id="create-new-bill-button"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              + Create New Bill
            </Link>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm" id="erp-bills-table">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th scope="col" className="px-6 py-3.5">Bill ID</th>
                <th scope="col" className="px-6 py-3.5">Vendor</th>
                <th scope="col" className="px-6 py-3.5">Invoice No</th>
                <th scope="col" className="px-6 py-3.5">Invoice Date</th>
                <th scope="col" className="px-6 py-3.5">Due Date</th>
                <th scope="col" className="px-6 py-3.5 text-right">Amount</th>
                <th scope="col" className="px-6 py-3.5">Status</th>
                <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No bills recorded in AcmeBooks yet.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => {
                  const statusColor =
                    bill.status === 'Paid'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800';

                  const formattedAmount =
                    bill.currency === 'INR'
                      ? `INR ${bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                      : `$${bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                  return (
                    <tr key={bill.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{bill.id}</td>
                      <td className="px-6 py-4 font-semibold text-white">{bill.vendor_name}</td>
                      <td className="px-6 py-4 font-mono text-white">{bill.invoice_no}</td>
                      <td className="px-6 py-4 text-slate-300">{bill.invoice_date}</td>
                      <td className="px-6 py-4 text-slate-400">{bill.due_date}</td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-white">
                        {formattedAmount}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/erp/bills/${bill.id}`}
                          id={`view-bill-${bill.invoice_no.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline"
                        >
                          View Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
