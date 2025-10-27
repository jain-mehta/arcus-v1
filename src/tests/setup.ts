import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// ? Cleanup after each test
afterEach(() => {
  cleanup();
});

// ? Mock environment variables
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/arcus_test';
process.env.JWT_SECRET = 'test-secret';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests

// ? Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

// ? Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

