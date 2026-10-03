import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isErpAuthenticated } from '@/lib/auth';

/**
 * Helper to parse DD/MM/YYYY into a Date object
 * @param {string} str
 * @returns {Date|null}
 */
function parseDateDMY(str) {
  if (!str || typeof str !== 'string') return null;
  const match = str.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

export async function POST(request) {
  const authed = await isErpAuthenticated();
  if (!authed) {
    return NextResponse.redirect(new URL('/erp/login?returnUrl=/erp/bills/new', request.url), { status: 303 });
  }

  const db = getDb();

  // 1. Chaos Mode Check
  const chaosSetting = db.prepare("SELECT value FROM settings WHERE key = 'chaos_enabled'").get();
  const isChaos = chaosSetting?.value === 'true';

  if (isChaos) {
    const attemptsRow = db.prepare("SELECT value FROM settings WHERE key = 'chaos_attempts'").get();
    const attempts = parseInt(attemptsRow?.value || '0', 10);

    if (attempts === 0) {
      // First attempt during chaos mode returns transient 500
      db.prepare("UPDATE settings SET value = '1' WHERE key = 'chaos_attempts'").run();
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head>
  <title>500 Internal Server Error</title>
  <style>
    body { background: #0b0f17; color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { background: #1e293b; padding: 2rem; border-radius: 8px; border: 1px solid #ef4444; max-width: 500px; text-align: center; }
    h1 { color: #ef4444; margin-top: 0; }
    p { color: #94a3b8; }
    button { background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="box">
    <h1>500 - Internal Server Error</h1>
    <p>Service temporarily unavailable. Please retry.</p>
    <button onclick="window.history.back()">Go Back and Retry</button>
  </div>
</body>
</html>`,
        {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    } else {
      // Second attempt succeeds; reset chaos attempts counter
      db.prepare("UPDATE settings SET value = '0' WHERE key = 'chaos_attempts'").run();
    }
  }

  // 2. Parse form data
  const formData = await request.formData();
  const vendorName = (formData.get('vendor_name') || '').trim();
  const invoiceNo = (formData.get('invoice_no') || '').trim();
  const invoiceDateStr = (formData.get('invoice_date') || '').trim();
  const dueDateStr = (formData.get('due_date') || '').trim();
  const amountStr = (formData.get('amount') || '').trim();
  const currency = (formData.get('currency') || 'USD').trim();
  const notes = (formData.get('notes') || '').trim();

  const errors = {};

  // Vendor validation
  if (!vendorName) {
    errors.vendor_name = 'Vendor selection is required';
  }

  // Invoice Number validation
  if (!invoiceNo) {
    errors.invoice_no = 'Invoice Number is required';
  }

  // Date format validations
  const invoiceDate = parseDateDMY(invoiceDateStr);
  if (!invoiceDate) {
    errors.invoice_date = 'Invoice Date must be in DD/MM/YYYY format';
  }

  const dueDate = parseDateDMY(dueDateStr);
  if (!dueDate) {
    errors.due_date = 'Due Date must be in DD/MM/YYYY format';
  }

  // Comparison validation
  if (invoiceDate && dueDate && dueDate <= invoiceDate) {
    errors.due_date = 'Due Date must be after Invoice Date';
  }

  // Amount validation
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    errors.amount = 'Amount must be a positive number greater than 0';
  }

  // Duplicate Check
  if (vendorName && invoiceNo) {
    const existing = db
      .prepare('SELECT id FROM bills WHERE vendor_name = ? AND invoice_no = ?')
      .get(vendorName, invoiceNo);
    if (existing) {
      errors.duplicate = `Duplicate Bill: An invoice record with number ${invoiceNo} already exists for ${vendorName}`;
    }
  }

  // If validation errors exist, redirect back to form with error parameters & preserve form state
  if (Object.keys(errors).length > 0) {
    const redirectUrl = new URL('/erp/bills/new', request.url);
    redirectUrl.searchParams.set('errors', JSON.stringify(errors));
    redirectUrl.searchParams.set('vendor_name', vendorName);
    redirectUrl.searchParams.set('invoice_no', invoiceNo);
    redirectUrl.searchParams.set('invoice_date', invoiceDateStr);
    redirectUrl.searchParams.set('due_date', dueDateStr);
    redirectUrl.searchParams.set('amount', amountStr);
    redirectUrl.searchParams.set('currency', currency);
    redirectUrl.searchParams.set('notes', notes);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  // Insert bill into database
  const billId = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT INTO bills (
      id, vendor_name, invoice_no, invoice_date, due_date, amount, currency, notes, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    billId,
    vendorName,
    invoiceNo,
    invoiceDateStr,
    dueDateStr,
    amount,
    currency,
    notes,
    'Pending Approval',
    new Date().toISOString()
  );

  // Redirect to bill detail page with success banner
  const successUrl = new URL(`/erp/bills/${billId}`, request.url);
  successUrl.searchParams.set('created', 'true');
  return NextResponse.redirect(successUrl, { status: 303 });
}
