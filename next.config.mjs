/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configure for VM deployment with subpath
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // Trailing slash for better compatibility
  trailingSlash: true,
  
  async redirects() {
    return [
      {
        source: '/',
        destination: '/books',
        permanent: false,
      },
    ];
  },
  
  // Output configuration for static export if needed
  output: 'standalone',
  
  // Image optimization settings for VM deployment
  images: {
    unoptimized: true,
  },
}

export default nextConfig;