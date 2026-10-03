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
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] flex flex-col font-sans select-none">
      {/* ERP Top Header */}
      <header className="h-12 border-b border-[#242424] bg-[#0A0A0A] px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/erp/bills" className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-[#FF6A1A] rounded-[3px]" />
            <span className="text-[14px] font-semibold text-[#EDEDED] tracking-tight">
              AcmeBooks
            </span>
          </Link>
          <div className="h-4 w-px bg-[#242424]" />
          <nav className="flex items-center gap-4 text-[12px]">
            <Link href="/erp/bills" className="text-[#FF6A1A] font-medium">
              Bills
            </Link>
            <Link href="/erp/bills/new" className="text-[#8C8C8C] hover:text-[#EDEDED]">
              New Bill
            </Link>
            <Link href="/erp/admin" className="text-[#8C8C8C] hover:text-[#EDEDED]">
              Admin
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#8C8C8C] bg-[#161616] px-2 py-0.5 rounded-[4px] border border-[#242424]">
            finance@acme.test
          </span>
          <a
            href="/erp/api/logout"
            className="text-[12px] text-[#8C8C8C] hover:text-[#EDEDED] transition-colors"
          >
            Sign out
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-6 py-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h2 className="text-[20px] font-semibold text-[#EDEDED] tracking-tight">
              Accounts Payable Bills
            </h2>
            <p className="text-[12px] text-[#8C8C8C] mt-0.5">
              Internal ledger of vendor invoices registered for payment processing
            </p>
          </div>
          <div>
            <Link
              href="/erp/bills/new"
              id="create-new-bill-button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold text-[#0A0A0A] bg-[#FF6A1A] hover:bg-[#FF7F3A] active:bg-[#E55A0F] transition-colors"
            >
              + Create New Bill
            </Link>
          </div>
        </div>

        {/* Bills Table */}
        <div className="border border-[#242424] rounded-[6px] overflow-hidden bg-[#111111]">
          <table className="w-full text-left border-collapse text-[13px]" id="erp-bills-table">
            <thead className="bg-[#161616] text-[#8C8C8C] text-[11px] uppercase tracking-wider font-medium border-b border-[#242424] select-none sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Bill ID</th>
                <th className="px-4 py-2.5">Vendor</th>
                <th className="px-4 py-2.5">Invoice No</th>
                <th className="px-4 py-2.5">Invoice Date</th>
                <th className="px-4 py-2.5">Due Date</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424] text-[#EDEDED]">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#5E5E5E] text-[12px]">
                    No bills recorded in AcmeBooks yet.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => {
                  const isPaid = bill.status === 'Paid';
                  const formattedAmount =
                    bill.currency === 'INR'
                      ? `INR ${bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                      : `$${bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                  return (
                    <tr key={bill.id} className="hover:bg-[#161616] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[#8C8C8C]">
                        {bill.id}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#EDEDED]">
                        {bill.vendor_name}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[#EDEDED]">
                        {bill.invoice_no}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[12px] text-[#8C8C8C]">
                        {bill.invoice_date}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[12px] text-[#8C8C8C]">
                        {bill.due_date}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-[#EDEDED] tabular-nums">
                        {formattedAmount}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded-[3px] text-[11px] font-mono border ${
                            isPaid
                              ? 'bg-[#3FB950]/10 text-[#3FB950] border-[#3FB950]/20'
                              : 'bg-[#D29922]/10 text-[#D29922] border-[#D29922]/20'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/erp/bills/${bill.id}`}
                          id={`view-bill-${bill.invoice_no.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          className="text-[12px] text-[#FF6A1A] hover:text-[#FF7F3A] transition-colors"
                        >
                          View Details →
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

      <footer className="border-t border-[#1C1C1C] py-4 text-center text-[11px] text-[#5E5E5E]">
        AcmeBooks Financial Ledger • Internal System of Record
      </footer>
    </div>
  );
}
