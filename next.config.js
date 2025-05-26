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
  // Increase build memory limit
  experimental: {
    // Detect and optimize duplicate dependencies in the build
    optimizeCss: true,
    // Enable larger payload sizes for API routes
    serverActions: {
      bodySizeLimit: '10mb',
    },
    serverComponentsExternalPackages: ['mongoose'],
  },
  // External packages that should be treated as server components
  serverExternalPackages: ['mongoose'],
  
  // Add image configuration to handle external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
  // Increase body size limits for file uploads
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
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
  // Increase function timeout for uploads
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
    // Increase function execution timeout
    proxyTimeout: 300000, // 5 minutes
  },
};

module.exports = nextConfig; 