const AGENT_SERVER_URL =
  process.env.AGENT_SERVER_URL ||
  process.env.NEXT_PUBLIC_AGENT_SERVER_URL ||
  'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['pdfkit'],
  async rewrites() {
    return [
      {
        source: '/runs/:path*',
        destination: `${AGENT_SERVER_URL}/runs/:path*`,
      },
    ];
  },
};

export default nextConfig;
