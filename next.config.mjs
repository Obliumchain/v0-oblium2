/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Security headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ]
  },
  experimental: {
    // Minimize file system operations
    isrMemoryCacheSize: 0,
    // Reduce compilation overhead
    webpackMemoryOptimizations: true,
  },
  // Disable logging to reduce disk writes
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Optimize output
  output: 'standalone',
  compress: true,
}

export default nextConfig
