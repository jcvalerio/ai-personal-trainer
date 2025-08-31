/**
 * MSW Browser Setup
 * Mock Service Worker setup for browser environment (development/testing)
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup MSW worker for browser environment
export const worker = setupWorker(...handlers);