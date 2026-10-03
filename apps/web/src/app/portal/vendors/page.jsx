import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isPortalAuthenticated } from '@/lib/auth';
import { getDb } from '@/lib/db';

export default async function VendorsPage() {
  const authed = await isPortalAuthenticated();
  if (!authed) {
    redirect('/portal/login?returnUrl=/portal/vendors');
  }

  const db = getDb();
  const vendors = db.prepare('SELECT * FROM vendors ORDER BY name ASC').all();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] flex flex-col font-sans select-none">
      {/* Top Navbar */}
      <header className="h-12 border-b border-[#242424] bg-[#0A0A0A] px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/portal/vendors" className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-[#FF6A1A] rounded-[3px]" />
            <span className="text-[14px] font-semibold text-[#EDEDED] tracking-tight">
              VendorHub
            </span>
          </Link>
          <div className="h-4 w-px bg-[#242424]" />
          <span className="text-[12px] text-[#8C8C8C]">Supplier Directory</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#8C8C8C] bg-[#161616] px-2 py-0.5 rounded-[4px] border border-[#242424]">
            ops@acme.test
          </span>
          <a
            href="/portal/api/logout"
            className="text-[12px] text-[#8C8C8C] hover:text-[#EDEDED] transition-colors"
          >
            Sign out
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-6 py-8 flex-1">
        <div className="mb-6">
          <h2 className="text-[20px] font-semibold text-[#EDEDED] tracking-tight">
            Commercial Vendors
          </h2>
          <p className="text-[13px] text-[#8C8C8C] mt-1">
            Select a verified supplier to review, cross-reference, and download commercial invoices.
          </p>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vendors.map((vendor) => {
            const invoiceCountRow = db
              .prepare('SELECT count(*) as count FROM invoices WHERE vendor_id = ?')
              .get(vendor.id);
            const count = invoiceCountRow ? invoiceCountRow.count : 0;

            return (
              <div
                key={vendor.id}
                className="bg-[#111111] border border-[#242424] hover:border-[#333333] rounded-[6px] p-4 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[14px] font-semibold text-[#EDEDED]">
                      {vendor.name}
                    </h3>
                    <span className="text-[11px] font-mono text-[#8C8C8C] bg-[#161616] px-2 py-0.5 rounded-[4px] border border-[#242424]">
                      {count} invoices
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[#5E5E5E]">
                    ID: {vendor.id}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1C1C1C] flex justify-end">
                  <Link
                    href={`/portal/vendors/${vendor.id}/invoices`}
                    className="inline-flex items-center text-[12px] font-medium text-[#FF6A1A] hover:text-[#FF7F3A] transition-colors"
                    id={`view-vendor-${vendor.slug}`}
                    aria-label={`View Invoices for ${vendor.name}`}
                  >
                    View Invoices →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-[#1C1C1C] py-4 text-center text-[11px] text-[#5E5E5E]">
        VendorHub External Supplier Network • Simulated Environment
      </footer>
    </div>
  );
}
