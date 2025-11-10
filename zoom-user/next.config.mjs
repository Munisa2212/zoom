/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for Zoom SDK - prevent it from being bundled on server side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@zoom/meetingsdk');
    }
    return config;
  },
}

export default nextConfig
