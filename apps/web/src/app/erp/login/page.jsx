import Link from 'next/link';

export default async function ErpLoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const returnUrl = params?.returnUrl || '/erp/bills';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 rounded-full border border-emerald-800/50 mb-3">
          Internal Corporate ERP
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center space-x-2">
          <span>AcmeBooks</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          CentrAlign Financial Operations & Accounts Payable
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow-xl border border-slate-800 sm:rounded-xl sm:px-10">
          {error && (
            <div role="alert" className="mb-6 p-4 rounded-lg bg-red-950/60 border border-red-800 text-sm text-red-200">
              {error === 'invalid_credentials'
                ? 'Invalid finance credentials. Please verify username and password.'
                : 'A login error occurred. Please try again.'}
            </div>
          )}

          <form action="/erp/api/login" method="POST" className="space-y-6">
            <input type="hidden" name="returnUrl" value={returnUrl} />

            <div>
              <label htmlFor="erp-username" className="block text-sm font-medium text-slate-200">
                Finance Operator ID
              </label>
              <div className="mt-1">
                <input
                  id="erp-username"
                  name="username"
                  type="text"
                  required
                  placeholder="finance@acme.test"
                  defaultValue="finance@acme.test"
                  className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-md shadow-sm bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="erp-password" className="block text-sm font-medium text-slate-200">
                Security Password
              </label>
              <div className="mt-1">
                <input
                  id="erp-password"
                  name="password"
                  type="password"
                  required
                  placeholder="books123"
                  defaultValue="books123"
                  className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-md shadow-sm bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded border border-slate-800">
              <span className="font-semibold text-slate-300">Default Finance Login:</span>
              <br />Username: <code className="text-emerald-300">finance@acme.test</code>
              <br />Password: <code className="text-emerald-300">books123</code>
            </div>

            <div>
              <button
                type="submit"
                id="erp-login-submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                Sign In to AcmeBooks
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link href="/console" className="text-slate-400 hover:text-white underline">
            Go to Agent Console
          </Link>{' '}
          &bull;{' '}
          <Link href="/portal/vendors" className="text-slate-400 hover:text-white underline">
            Go to Vendor Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
