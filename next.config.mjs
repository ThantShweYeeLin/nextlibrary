/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/books',
        permanent: false,
      },
    ];
  },
  // If you need to deploy under a subpath
  basePath: process.env.NODE_ENV === 'production' ? '/library' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/library/' : '',
}

export default nextConfig;