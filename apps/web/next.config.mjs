/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['pdfkit'],
  async rewrites() {
    return [
      {
        source: '/runs/:path*',
        destination: 'http://localhost:4000/runs/:path*',
      },
    ];
  },
};

export default nextConfig;
