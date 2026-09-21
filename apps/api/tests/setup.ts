import path from 'node:path';
import { config } from 'dotenv';

// Loaded before any test file (and therefore before `src/config/env.ts` runs its
// own `dotenv/config`), so these values win without needing to touch the real
// development `.env`.
config({ path: path.resolve(__dirname, '../.env.test') });
