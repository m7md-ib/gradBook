import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    hookTimeout: 30_000,
    testTimeout: 15_000,
    // Integration tests share one Postgres database with no per-test transaction
    // isolation, so they must run sequentially in a single process.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
