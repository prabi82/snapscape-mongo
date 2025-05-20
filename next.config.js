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
  }
};

module.exports = nextConfig; 