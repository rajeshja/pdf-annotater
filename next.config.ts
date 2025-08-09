import type {NextConfig} from 'next';
import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // This is the correct way to configure pdf.js worker for Next.js
    if (!isServer) {
      const pdfJsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
      const pdfWorkerPath = path.join(pdfJsDistPath, 'build', 'pdf.worker.min.mjs');
      
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: pdfWorkerPath,
              to: path.join(config.output.path ?? '', 'static', 'chunks'),
            },
          ],
        })
      );

       // This is needed to make sure that the worker is resolved correctly
      config.resolve.alias['pdfjs-dist/build/pdf.worker.min.mjs'] = path.join(config.output.path ?? '', 'static', 'chunks', 'pdf.worker.min.mjs');
    }

    return config;
  },
};

export default nextConfig;
