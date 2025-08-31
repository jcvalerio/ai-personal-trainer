/**
 * Vitest Configuration
 * Test configuration with Next.js, MSW, and React Query support
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    css: false, // Disable CSS processing for faster tests
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/mocks/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'coverage/',
        '.next/',
        'playwright*',
        '**/*.spec.{js,ts,tsx}',
        '**/*.test.{js,ts,tsx}',
      ],
      include: [
        'src/**/*.{js,ts,tsx}',
        'lib/**/*.{js,ts,tsx}',
        'components/**/*.{js,ts,tsx}',
        'hooks/**/*.{js,ts,tsx}',
        'app/**/*.{js,ts,tsx}'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/app': path.resolve(__dirname, './app'),
      '@/types': path.resolve(__dirname, './types'),
      '@/styles': path.resolve(__dirname, './styles'),
    },
  },
  define: {
    'process.env': process.env,
  },
});