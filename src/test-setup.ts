/**
 * Test Setup Configuration
 * Global test setup for Vitest with MSW integration
 */

import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';
import { seedDatabase, resetDatabase } from './mocks/data';

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests instead of erroring
  });
  
  // Seed the database with initial test data
  seedDatabase();
});

// Clean up after each test and reset handlers to their initial state
afterEach(() => {
  server.resetHandlers();
  
  // Reset database to initial state
  resetDatabase();
  seedDatabase();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Mock console methods in tests to avoid noise
global.console = {
  ...console,
  // Uncomment below to hide specific console outputs in tests
  // warn: vi.fn(),
  // error: vi.fn(),
};