
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Skip static optimization for dynamic routes
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack(config, { isServer }) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    
    if (isServer) {
      // Prevent server-only AI libraries from being statically bundled by webpack.
      // This keeps packages like genkit, @genkit-ai/*, dotprompt and handlebars
      // out of the webpack build so we don't hit `require.extensions` warnings.
      const extraExternals = [
        'genkit',
        '@genkit-ai/core',
        '@genkit-ai/googleai',
        '@genkit-ai/ai',
        '@genkit-ai/next',
        '@genkit-ai/firebase',
        'dotprompt',
        'handlebars',
        'typeorm', // Exclude TypeORM from webpack bundling
      ];
      config.externals = Array.isArray(config.externals)
        ? [...config.externals, ...extraExternals]
        : config.externals;
    }

    // Suppress TypeORM webpack warnings
    config.ignoreWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings.push({
      module: /typeorm/,
      message: /Critical dependency|request of a dependency/,
    });

    config.ignoreWarnings.push({
      module: /typeorm/,
      message: /Module not found|Can't resolve/,
    });
    
    return config;
  }
};

export default nextConfig;
