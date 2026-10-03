import Link from 'next/link';

export default async function PortalLoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const returnUrl = params?.returnUrl || '/portal/vendors';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-950/60 rounded-full border border-sky-800/50 mb-3">
          Simulated Third-Party Service
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Global Vendor Portal
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to access corporate supplier billing and invoices
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/80 py-8 px-4 shadow-xl border border-slate-700/60 sm:rounded-xl sm:px-10">
          {error && (
            <div role="alert" className="mb-6 p-4 rounded-lg bg-red-950/60 border border-red-800 text-sm text-red-200">
              {error === 'invalid_credentials'
                ? 'Invalid username or password. Please verify credentials.'
                : 'A login error occurred. Please try again.'}
            </div>
          )}

          <form action="/portal/api/login" method="POST" className="space-y-6">
            <input type="hidden" name="returnUrl" value={returnUrl} />

            <div>
              <label htmlFor="portal-username" className="block text-sm font-medium text-slate-200">
                Email Address / Username
              </label>
              <div className="mt-1">
                <input
                  id="portal-username"
                  name="username"
                  type="text"
                  required
                  placeholder="ops@acme.test"
                  defaultValue="ops@acme.test"
                  className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="portal-password" className="block text-sm font-medium text-slate-200">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="portal-password"
                  name="password"
                  type="password"
                  required
                  placeholder="demo123"
                  defaultValue="demo123"
                  className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded border border-slate-700">
              <span className="font-semibold text-slate-300">Demo Credentials:</span>
              <br />Username: <code className="text-sky-300">ops@acme.test</code>
              <br />Password: <code className="text-sky-300">demo123</code>
            </div>

            <div>
              <button
                type="submit"
                id="portal-login-submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              >
                Sign In to Vendor Portal
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link href="/console" className="text-slate-400 hover:text-white underline">
            Go to Agent Console
          </Link>{' '}
          &bull;{' '}
          <Link href="/erp/bills" className="text-slate-400 hover:text-white underline">
            Go to AcmeBooks ERP
          </Link>
        </div>
      </div>
    </div>
  );
}
