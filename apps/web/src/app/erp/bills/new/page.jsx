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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ERP Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center space-x-3">
          <Link href="/erp/bills" className="text-xs text-slate-400 hover:text-white flex items-center space-x-1">
            <span>&larr; Bills</span>
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="font-semibold text-lg text-white">Record New Payable Bill</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-md">
            finance@acme.test
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">New Bill Entry</h2>
          <p className="text-sm text-slate-400 mt-1">
            Enter verified invoice details to queue this bill for finance review and payment.
          </p>
        </div>

        {/* Global Duplicate Error Banner */}
        {errors.duplicate && (
          <div
            role="alert"
            id="error-banner-duplicate"
            className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 shadow-md flex items-start space-x-3"
          >
            <div className="text-red-400 font-bold text-lg">&times;</div>
            <div>
              <h3 className="font-semibold text-red-100">Duplicate Submission Rejected</h3>
              <p className="text-sm mt-0.5">{errors.duplicate}</p>
            </div>
          </div>
        )}

        {/* Entry Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
          <form action="/erp/api/bills" method="POST" className="space-y-6" id="new-bill-form">
            {/* Vendor */}
            <div>
              <label htmlFor="bill-vendor" className="block text-sm font-medium text-slate-200">
                Vendor / Supplier <span className="text-red-400">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="bill-vendor"
                  name="vendor_name"
                  defaultValue={defaultVendor}
                  required
                  className="block w-full px-3 py-2.5 border border-slate-700 rounded-lg shadow-sm bg-slate-950 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.vendor_name && (
                <p role="alert" className="mt-1 text-xs text-red-400 font-medium" id="error-vendor-name">
                  {errors.vendor_name}
                </p>
              )}
            </div>

            {/* Invoice Number */}
            <div>
              <label htmlFor="bill-invoice-no" className="block text-sm font-medium text-slate-200">
                Invoice Number <span className="text-red-400">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="bill-invoice-no"
                  name="invoice_no"
                  type="text"
                  required
                  placeholder="e.g. INV-1042"
                  defaultValue={defaultInvoiceNo}
                  className="block w-full px-3 py-2 border border-slate-700 rounded-lg shadow-sm bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm font-mono"
                />
              </div>
              {errors.invoice_no && (
                <p role="alert" className="mt-1 text-xs text-red-400 font-medium" id="error-invoice-no">
                  {errors.invoice_no}
                </p>
              )}
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bill-invoice-date" className="block text-sm font-medium text-slate-200">
                  Invoice Date (DD/MM/YYYY) <span className="text-red-400">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="bill-invoice-date"
                    name="invoice_date"
                    type="text"
                    required
                    placeholder="DD/MM/YYYY"
                    defaultValue={defaultInvoiceDate}
                    className="block w-full px-3 py-2 border border-slate-700 rounded-lg shadow-sm bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm font-mono"
                  />
                </div>
                {errors.invoice_date && (
                  <p role="alert" className="mt-1 text-xs text-red-400 font-medium" id="error-invoice-date">
                    {errors.invoice_date}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="bill-due-date" className="block text-sm font-medium text-slate-200">
                  Due Date (DD/MM/YYYY) <span className="text-red-400">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="bill-due-date"
                    name="due_date"
                    type="text"
                    required
                    placeholder="DD/MM/YYYY"
                    defaultValue={defaultDueDate}
                    className="block w-full px-3 py-2 border border-slate-700 rounded-lg shadow-sm bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm font-mono"
                  />
                </div>
                {errors.due_date && (
                  <p role="alert" className="mt-1 text-xs text-red-400 font-medium" id="error-due-date">
                    {errors.due_date}
                  </p>
                )}
              </div>
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="bill-amount" className="block text-sm font-medium text-slate-200">
                  Total Amount <span className="text-red-400">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="bill-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="12450.00"
                    defaultValue={defaultAmount}
                    className="block w-full px-3 py-2 border border-slate-700 rounded-lg shadow-sm bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm font-mono"
                  />
                </div>
                {errors.amount && (
                  <p role="alert" className="mt-1 text-xs text-red-400 font-medium" id="error-amount">
                    {errors.amount}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="bill-currency" className="block text-sm font-medium text-slate-200">
                  Currency
                </label>
                <div className="mt-1">
                  <select
                    id="bill-currency"
                    name="currency"
                    defaultValue={defaultCurrency}
                    className="block w-full px-3 py-2.5 border border-slate-700 rounded-lg shadow-sm bg-slate-950 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="bill-notes" className="block text-sm font-medium text-slate-200">
                Notes & Remittance Info
              </label>
              <div className="mt-1">
                <textarea
                  id="bill-notes"
                  name="notes"
                  rows={3}
                  defaultValue={defaultNotes}
                  placeholder="Optional operational or approval notes..."
                  className="block w-full px-3 py-2 border border-slate-700 rounded-lg shadow-sm bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
              <Link
                href="/erp/bills"
                className="px-4 py-2 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                id="submit-bill-button"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-md transition-colors"
              >
                Submit Bill
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
