/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
