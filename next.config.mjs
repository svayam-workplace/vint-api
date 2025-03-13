/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env:{
    MAIN_URL : "https://api.sinc.network",
    HEADLESS : false,
  }
};

export default nextConfig;