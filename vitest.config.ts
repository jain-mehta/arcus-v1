import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // ✅ Test environment
    environment: 'happy-dom',
    
    // ✅ Global test utilities
    globals: true,
    
    // ✅ Setup files
    setupFiles: ['./src/tests/setup.ts'],
    
    // ✅ Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        'dist/',
        '.next/',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
    
    // ✅ Test matching
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next', 'e2e'],
    
    // ✅ Test timeout
    testTimeout: 10000,
    
    // ✅ Reporters
    reporters: ['verbose'],
    
    // ✅ Mocking
    mockReset: true,
    restoreMocks: true,
  },
  
  // ✅ Resolve aliases (match tsconfig paths)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/entities': path.resolve(__dirname, './src/lib/entities'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
});
