import Link from 'next/link';

export default async function ErpLoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const returnUrl = params?.returnUrl || '/erp/bills';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] flex flex-col justify-center items-center p-4 selection:bg-[#FF6A1A]/20">
      <div className="w-full max-w-[380px]">
        {/* Wordmark Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-3.5 h-3.5 bg-[#FF6A1A] rounded-[3px]" />
            <span className="text-[16px] font-semibold tracking-tight text-[#EDEDED]">
              AcmeBooks ERP
            </span>
          </div>
          <p className="text-[12px] text-[#8C8C8C]">
            Internal Financial Operations & Accounts Payable
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111111] border border-[#242424] rounded-[6px] p-6">
          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-[4px] bg-[#F85149]/10 border border-[#F85149]/30 text-[12px] text-[#F85149]"
            >
              {error === 'invalid_credentials'
                ? 'Invalid finance credentials. Please verify username and password.'
                : 'A login error occurred. Please try again.'}
            </div>
          )}

          <form action="/erp/api/login" method="POST" className="space-y-4">
            <input type="hidden" name="returnUrl" value={returnUrl} />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="erp-username"
                className="text-[12px] font-medium text-[#EDEDED]"
              >
                Finance Operator ID
              </label>
              <input
                id="erp-username"
                name="username"
                type="text"
                required
                placeholder="finance@acme.test"
                defaultValue="finance@acme.test"
                className="w-full bg-[#161616] text-[#EDEDED] text-[13px] border border-[#242424] hover:border-[#333333] focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-1 rounded-[6px] px-3 py-2 placeholder-[#5E5E5E]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="erp-password"
                className="text-[12px] font-medium text-[#EDEDED]"
              >
                Security Password
              </label>
              <input
                id="erp-password"
                name="password"
                type="password"
                required
                placeholder="books123"
                defaultValue="books123"
                className="w-full bg-[#161616] text-[#EDEDED] text-[13px] border border-[#242424] hover:border-[#333333] focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-1 rounded-[6px] px-3 py-2 placeholder-[#5E5E5E]"
              />
            </div>

            <div className="text-[11px] font-mono text-[#8C8C8C] bg-[#161616] p-2.5 rounded-[4px] border border-[#242424]">
              <span className="text-[#EDEDED] block mb-0.5">Finance Credentials:</span>
              <span>finance@acme.test / books123</span>
            </div>

            <button
              type="submit"
              id="erp-login-submit"
              className="w-full py-2 px-4 rounded-[6px] text-[13px] font-semibold text-[#0A0A0A] bg-[#FF6A1A] hover:bg-[#FF7F3A] active:bg-[#E55A0F] focus-visible:outline-2 focus-visible:outline-[#FF6A1A] focus-visible:outline-offset-2 transition-colors cursor-pointer"
            >
              Sign In to AcmeBooks
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="mt-5 text-center text-[12px] text-[#5E5E5E] flex items-center justify-center gap-3">
          <Link href="/console" className="hover:text-[#EDEDED]">
            Agent Console
          </Link>
          <span>•</span>
          <Link href="/portal/vendors" className="hover:text-[#EDEDED]">
            VendorHub Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
