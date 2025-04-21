import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Optimize CSS loading by inlining critical CSS and deferring non-critical CSS
    optimizeCss: true,
    // Improve server-side React performance
    optimizeServerReact: true,
    // Optimize package imports from UI libraries
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select']
  },
  // Configure critters for critical CSS extraction
  compiler: {
    // Enables the styled-components compiler
    styledComponents: true,
  },
  // Configure Next.js to minify CSS in production
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,
  // Enable custom webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Only optimize in production builds
    if (!dev) {
      // Apply font optimization
      if (!isServer) {
        // Inline critical CSS
        config.optimization.splitChunks.cacheGroups = {
          ...config.optimization.splitChunks.cacheGroups,
          styles: {
            name: 'styles',
            test: /\.(css|scss)$/,
            chunks: 'all',
            enforce: true,
          },
        };
      }
    }
    
    return config;
  },
};

export default nextConfig;
