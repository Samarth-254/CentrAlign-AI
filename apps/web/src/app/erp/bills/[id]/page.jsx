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
            ← All Bills
          </Link>
          <span className="text-[#333333]">/</span>
          <span className="text-[12px] text-[#EDEDED] font-medium font-mono">{bill.invoice_no}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#8C8C8C] bg-[#161616] px-2 py-0.5 rounded-[4px] border border-[#242424]">
            finance@acme.test
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto w-full px-6 py-8 flex-1">
        {/* Success Banner when Bill Created */}
        {isJustCreated && (
          <div
            role="status"
            id="bill-created-banner"
            className="mb-6 p-3.5 rounded-[6px] bg-[#3FB950]/10 border border-[#3FB950]/30 text-[#3FB950] text-[12px] flex items-center gap-2.5"
          >
            <span className="font-bold text-[14px] leading-none">✓</span>
            <div>
              <h3 className="font-semibold text-[#EDEDED]">Bill created</h3>
              <p className="text-[11px] text-[#8C8C8C] mt-0.5">
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
            className="mb-6 p-3.5 rounded-[6px] bg-[#3FB950]/10 border border-[#3FB950]/30 text-[#3FB950] text-[12px] flex items-center gap-2.5"
          >
            <span className="font-bold text-[14px] leading-none">✓</span>
            <div>
              <h3 className="font-semibold text-[#EDEDED]">Payment Status Updated</h3>
              <p className="text-[11px] text-[#8C8C8C] mt-0.5">
                The bill has been marked as Paid in AcmeBooks.
              </p>
            </div>
          </div>
        )}

        {/* Bill Record Card */}
        <div className="bg-[#111111] border border-[#242424] rounded-[6px] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#242424] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-[#5E5E5E]">
                ID: {bill.id}
              </span>
              <h2 className="text-[18px] font-semibold text-[#EDEDED] mt-0.5">
                {bill.vendor_name}
              </h2>
            </div>
            <div>
              <span
                id="bill-status-badge"
                className={`inline-block px-2 py-0.5 rounded-[4px] text-[11px] font-mono border ${
                  bill.status === 'Paid'
                    ? 'bg-[#3FB950]/10 text-[#3FB950] border-[#3FB950]/20'
                    : 'bg-[#D29922]/10 text-[#D29922] border-[#D29922]/20'
                }`}
              >
                {bill.status}
              </span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            <div>
              <span className="text-[11px] text-[#8C8C8C] uppercase tracking-wider block">
                Invoice Number
              </span>
              <p className="font-mono text-[14px] font-semibold text-[#EDEDED] mt-0.5" id="detail-invoice-no">
                {bill.invoice_no}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-[#8C8C8C] uppercase tracking-wider block">
                Total Amount
              </span>
              <p className="font-mono text-[16px] font-bold text-[#EDEDED] mt-0.5 tabular-nums" id="detail-amount">
                {formattedAmount}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-[#8C8C8C] uppercase tracking-wider block">
                Invoice Date
              </span>
              <p className="font-mono text-[13px] text-[#EDEDED] mt-0.5" id="detail-invoice-date">
                {bill.invoice_date}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-[#8C8C8C] uppercase tracking-wider block">
                Due Date
              </span>
              <p className="font-mono text-[13px] text-[#EDEDED] mt-0.5" id="detail-due-date">
                {bill.due_date}
              </p>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[11px] text-[#8C8C8C] uppercase tracking-wider block">
                Notes & Remittance Info
              </span>
              <p className="text-[#8C8C8C] mt-1 bg-[#161616] p-3 rounded-[4px] border border-[#242424] text-[12px] font-mono">
                {bill.notes || 'No notes entered.'}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-3.5 bg-[#161616] border-t border-[#242424] flex items-center justify-between">
            <Link
              href="/erp/bills"
              className="text-[12px] text-[#8C8C8C] hover:text-[#EDEDED]"
            >
              ← Back to bills list
            </Link>

            {bill.status !== 'Paid' && (
              <form action={`/erp/api/bills/${bill.id}/pay`} method="POST">
                <button
                  type="submit"
                  id="mark-as-paid-button"
                  className="px-3.5 py-1.5 rounded-[6px] text-[12px] font-semibold text-[#0A0A0A] bg-[#FF6A1A] hover:bg-[#FF7F3A] active:bg-[#E55A0F] focus-visible:outline-2 focus-visible:outline-[#FF6A1A] transition-colors cursor-pointer"
                >
                  Mark as Paid
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1C1C1C] py-4 text-center text-[11px] text-[#5E5E5E]">
        AcmeBooks Financial Ledger • Internal System of Record
      </footer>
    </div>
  );
}
