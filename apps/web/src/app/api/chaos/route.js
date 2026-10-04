import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
  try {
    let enabled = false;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      enabled = !!body.enabled;
    } else {
      const formData = await request.formData();
      enabled = formData.get('enabled') === 'true';
    }

    const db = getDb();
    db.prepare("UPDATE settings SET value = ? WHERE key = 'chaos_enabled'").run(enabled ? 'true' : 'false');
    db.prepare("UPDATE settings SET value = '0' WHERE key = 'chaos_attempts'").run();

    // Check if called from HTML form
    const referer = request.headers.get('referer');
    if (referer && !contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/erp/admin?updated=true', request.url), { status: 303 });
    }

    return NextResponse.json({ ok: true, chaosEnabled: enabled });
  } catch (err) {
    console.error('Chaos update error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const db = getDb();
  const setting = db.prepare("SELECT value FROM settings WHERE key = 'chaos_enabled'").get();
  const enabled = setting?.value === 'true';
  return NextResponse.json({ enabled, chaosEnabled: enabled });
}
