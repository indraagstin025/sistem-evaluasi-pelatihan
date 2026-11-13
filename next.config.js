/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      '/api/peserta': ['./prisma/data/**/*'],
    },
  },
};

module.exports = nextConfig;
