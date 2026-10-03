import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isErpAuthenticated } from '@/lib/auth';

export async function POST(request, { params }) {
  const authed = await isErpAuthenticated();
  const { id } = await params;

  if (!authed) {
    return NextResponse.redirect(new URL(`/erp/login?returnUrl=/erp/bills/${id}`, request.url), { status: 303 });
  }

  const db = getDb();
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
  if (!bill) {
    return NextResponse.redirect(new URL('/erp/bills', request.url), { status: 303 });
  }

  // Update status to Paid
  db.prepare("UPDATE bills SET status = 'Paid' WHERE id = ?").run(id);

  const redirectUrl = new URL(`/erp/bills/${id}`, request.url);
  redirectUrl.searchParams.set('paid', 'true');
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
