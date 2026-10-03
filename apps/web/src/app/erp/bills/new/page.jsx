import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isErpAuthenticated } from '@/lib/auth';
import { getDb } from '@/lib/db';

export default async function NewBillPage({ searchParams }) {
  const authed = await isErpAuthenticated();
  if (!authed) {
    redirect('/erp/login?returnUrl=/erp/bills/new');
  }

  const sParams = await searchParams;
  let errors = {};
  if (sParams?.errors) {
    try {
      errors = JSON.parse(sParams.errors);
    } catch {
      // ignore
    }
  }

  const db = getDb();
  const vendors = db.prepare('SELECT * FROM vendors ORDER BY name ASC').all();

  const defaultVendor = sParams?.vendor_name || '';
  const defaultInvoiceNo = sParams?.invoice_no || '';
  const defaultInvoiceDate = sParams?.invoice_date || '';
  const defaultDueDate = sParams?.due_date || '';
  const defaultAmount = sParams?.amount || '';
  const defaultCurrency = sParams?.currency || 'USD';
  const defaultNotes = sParams?.notes || '';

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
          <span className="text-[#333333]">/</span>
          <Link href="/erp/bills" className="text-[12px] text-[#8C8C8C] hover:text-[#EDEDED]">
            ← Bills
          </Link>
          <span className="text-[#333333]">/</span>
          <h1 className="text-[12px] font-medium text-[#EDEDED]">Record New Payable Bill</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#8C8C8C] bg-[#161616] px-2 py-0.5 rounded-[4px] border border-[#242424]">
            finance@acme.test
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full px-6 py-8 flex-1">
        <div className="mb-6">
          <h2 className="text-[20px] font-semibold text-[#EDEDED] tracking-tight">
            New Bill Entry
          </h2>
          <p className="text-[12px] text-[#8C8C8C] mt-0.5">
            Enter verified invoice details to queue this bill for finance review and payment.
          </p>
        </div>

        {/* Global Duplicate Error Banner */}
        {errors.duplicate && (
          <div
            role="alert"
            id="error-banner-duplicate"
            className="mb-6 p-3.5 rounded-[6px] bg-[#F85149]/10 border border-[#F85149]/30 text-[#F85149] text-[12px] flex items-start gap-2.5"
          >
            <span className="font-bold text-[14px] leading-none mt-0.5">✕</span>
            <div>
              <h3 className="font-semibold text-[#EDEDED]">Duplicate Submission Rejected</h3>
              <p className="mt-0.5 text-[#F85149]">{errors.duplicate}</p>
            </div>
          </div>
        )}

        {/* Entry Form */}
        <div className="bg-[#111111] border border-[#242424] rounded-[6px] p-6">
          <form action="/erp/api/bills" method="POST" className="space-y-4" id="new-bill-form">
            {/* Vendor */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bill-vendor" className="text-[12px] font-medium text-[#EDEDED]">
                Vendor / Supplier <span className="text-[#F85149]">*</span>
              </label>
              <select
                id="bill-vendor"
                name="vendor_name"
                defaultValue={defaultVendor}
                required
                className="w-full bg-[#161616] text-[#EDEDED] text-[13px] border border-[#242424] hover:border-[#333333] focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-1 rounded-[6px] px-3 py-2"
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.name} className="bg-[#111111] text-[#EDEDED]">
                    {v.name}
                  </option>
                ))}
              </select>
              {errors.vendor_name && (
                <p role="alert" className="text-[11px] text-[#F85149]" id="error-vendor-name">
                  {errors.vendor_name}
                </p>
              )}
            </div>

            {/* Invoice Number */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bill-invoice-no" className="text-[12px] font-medium text-[#EDEDED]">
                Invoice Number <span className="text-[#F85149]">*</span>
              </label>
              <input
                id="bill-invoice-no"
                name="invoice_no"
                type="text"
                required
                placeholder="e.g. INV-1042"
                defaultValue={defaultInvoiceNo}
                className="w-full bg-[#161616] text-[#EDEDED] text-[13px] font-mono border border-[#242424] hover:border-[#333333] focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-1 rounded-[6px] px-3 py-2 placeholder-[#5E5E5E]"
              />
              {errors.invoice_no && (
                <p role="alert" className="text-[11px] text-[#F85149]" id="error-invoice-no">
                  {errors.invoice_no}
                </p>
              )}
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bill-invoice-date" className="text-[12px] font-medium text-[#EDEDED]">
                  Invoice Date (DD/MM/YYYY) <span className="text-[#F85149]">*</span>
                </label>
                <input
                  id="bill-invoice-date"
                  name="invoice_date"
                  type="text"
                  required
                  placeholder="DD/MM/YYYY"
                  defaultValue={defaultInvoiceDate}
                  className="w-full bg-[#161616] text-[#EDEDED] text-[13px] font-mono border border-[#242424] hover:border-[#333333] focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-1 rounded-[6px] px-3 py-2 placeholder-[#5E5E5E]"
                />
                <span className="text-[11px] text-[#8C8C8C]">Format: DD/MM/YYYY</span>
                {errors.invoice_date && (
                  <p role="alert" className="text-[11px] text-[#F85149]" id="error-invoice-date">
                    {errors.invoice_date}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="bill-due-date" className="text-[12px] font-medium text-[#EDEDED]">
                  Due Date (DD/MM/YYYY) <span className="text-[#F85149]">*</span>
                </label>
                <input
                  id="bill-due-date"
                  name="due_date"
                  type="text"
                  required
                  placeholder="DD/MM/YYYY"
                  defaultValue={defaultDueDate}
                  className="w-full bg-[#161616] text-[#EDEDED] text-[13px] font-mono border border-[#242424] hover:border-[#333333] focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-1 rounded-[6px] px-3 py-2 placeholder-[#5E5E5E]"
                />
                <span className="text-[11px] text-[#8C8C8C]">Format: DD/MM/YYYY</span>
                {errors.due_date && (
                  <p role="alert" className="text-[11px] text-[#F85149]" id="error-due-date">
                    {errors.due_date}
                  </p>
                )}
              </div>
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="bill-amount" className="text-[12px] font-medium text-[#EDEDED]">
                  Total Amount <span className="text-[#F85149]">*</span>
                </label>
                <input
                  id="bill-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="12450.00"
                  defaultValue={defaultAmount}
                  className="w-full bg-[#161616] text-[#EDEDED] text-[13px] font-mono border border-[#242424] hover:border-[#333333] focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-1 rounded-[6px] px-3 py-2 placeholder-[#5E5E5E]"
                />
                {errors.amount && (
                  <p role="alert" className="text-[11px] text-[#F85149]" id="error-amount">
                    {errors.amount}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="bill-currency" className="text-[12px] font-medium text-[#EDEDED]">
                  Currency
                </label>
                <select
                  id="bill-currency"
                  name="currency"
                  defaultValue={defaultCurrency}
                  className="w-full bg-[#161616] text-[#EDEDED] text-[13px] border border-[#242424] hover:border-[#333333] focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-1 rounded-[6px] px-3 py-2"
                >
                  <option value="USD" className="bg-[#111111] text-[#EDEDED]">USD ($)</option>
                  <option value="INR" className="bg-[#111111] text-[#EDEDED]">INR (₹)</option>
                  <option value="EUR" className="bg-[#111111] text-[#EDEDED]">EUR (€)</option>
                  <option value="GBP" className="bg-[#111111] text-[#EDEDED]">GBP (£)</option>
                  <option value="CAD" className="bg-[#111111] text-[#EDEDED]">CAD ($)</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bill-notes" className="text-[12px] font-medium text-[#EDEDED]">
                Notes & Remittance Info
              </label>
              <textarea
                id="bill-notes"
                name="notes"
                rows={3}
                defaultValue={defaultNotes}
                placeholder="Optional operational or approval notes..."
                className="w-full bg-[#161616] text-[#EDEDED] text-[13px] border border-[#242424] hover:border-[#333333] focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-1 rounded-[6px] p-3 placeholder-[#5E5E5E] resize-y"
              />
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-[#242424] flex items-center justify-end gap-2.5">
              <Link
                href="/erp/bills"
                className="px-3.5 py-1.5 border border-[#242424] rounded-[6px] text-[12px] text-[#8C8C8C] hover:text-[#EDEDED] hover:bg-[#161616] transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                id="submit-bill-button"
                className="px-4 py-1.5 rounded-[6px] text-[13px] font-semibold text-[#0A0A0A] bg-[#FF6A1A] hover:bg-[#FF7F3A] active:bg-[#E55A0F] focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-2 transition-colors cursor-pointer"
              >
                Submit Bill
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="border-t border-[#1C1C1C] py-4 text-center text-[11px] text-[#5E5E5E]">
        AcmeBooks Financial Ledger • Internal System of Record
      </footer>
    </div>
  );
}
