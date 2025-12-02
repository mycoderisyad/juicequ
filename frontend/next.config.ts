import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Add your production storage domain here
      // Example for AWS S3:
      // {
      //   protocol: 'https',
      //   hostname: '*.s3.amazonaws.com',
      //   pathname: '/**',
      // },
      // Example for Google Cloud Storage:
      // {
      //   protocol: 'https',
      //   hostname: 'storage.googleapis.com',
      //   pathname: '/**',
      // },
      // Example for Cloudinary:
      // {
      //   protocol: 'https',
      //   hostname: 'res.cloudinary.com',
      //   pathname: '/**',
      // },
    ],
  },
};

export default nextConfig;
