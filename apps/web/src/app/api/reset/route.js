import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function POST(request) {
  try {
    await seedDatabase();

    const referer = request.headers.get('referer');
    const contentType = request.headers.get('content-type') || '';
    if (referer && !contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/erp/admin?reset=true', request.url), { status: 303 });
    }

    return NextResponse.json({ ok: true, message: 'Database and mock data reset successfully' });
  } catch (err) {
    console.error('Reset error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
