/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost/api/:path*' // proxy to Nginx gateway
      }
    ];
  }
};

export default nextConfig;
