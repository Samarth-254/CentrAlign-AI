import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const username = formData.get('username');
    const password = formData.get('password');
    const returnUrl = formData.get('returnUrl') || '/erp/bills';

    if (username === 'finance@acme.test' && password === 'books123') {
      const response = NextResponse.redirect(new URL(returnUrl, request.url), { status: 303 });
      response.cookies.set('erp_session', 'finance@acme.test', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return response;
    }

    const loginUrl = new URL('/erp/login', request.url);
    loginUrl.searchParams.set('error', 'invalid_credentials');
    if (returnUrl) loginUrl.searchParams.set('returnUrl', returnUrl);
    return NextResponse.redirect(loginUrl, { status: 303 });
  } catch (err) {
    console.error('ERP login error:', err);
    return NextResponse.redirect(new URL('/erp/login?error=server_error', request.url), { status: 303 });
  }
}
