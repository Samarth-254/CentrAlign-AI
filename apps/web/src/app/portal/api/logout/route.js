import { NextResponse } from 'next/server';

export async function GET(request) {
  // Prevent Next.js prefetch from triggering logout
  if (
    request.headers.get('next-router-prefetch') ||
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('sec-purpose') === 'prefetch'
  ) {
    return new NextResponse(null, { status: 204 });
  }

  const response = NextResponse.redirect(new URL('/portal/login', request.url));
  response.cookies.delete('portal_session');
  return response;
}

export async function POST(request) {
  const response = NextResponse.redirect(new URL('/portal/login', request.url), { status: 303 });
  response.cookies.delete('portal_session');
  return response;
}
