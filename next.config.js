/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Turn off source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
  // Skip type checking during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // External packages that should be treated as server components
  serverExternalPackages: ['mongoose'],
  
  // Experimental features
  experimental: {
    // Detect and optimize duplicate dependencies in the build
    optimizeCss: true,
    // Enable larger payload sizes for API routes
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Increase function execution timeout
    proxyTimeout: 300000, // 5 minutes
  },
  
  // Add image configuration to handle external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Add headers for CORS and file upload optimization
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 