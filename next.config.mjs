/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configure for VM deployment with subpath
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  
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
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Image optimization settings for VM deployment
  images: {
    unoptimized: true,
  },
  
  // API route configuration
  async rewrites() {
    return {
      beforeFiles: [
        // Handle API routes properly with base path
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ],
    };
  },
}

export default nextConfig;