import { sql } from 'drizzle-orm';
import { db } from './client.js';
import { coverTemplates, notebookThemes, packages } from './schema/index.js';
import { seedCoverTemplates, seedPackages, seedPlatformSettings, seedThemes } from './seed.js';

async function isEmpty(table: typeof notebookThemes | typeof packages | typeof coverTemplates): Promise<boolean> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(table);
  return Number(row?.n ?? 0) === 0;
}

/**
 * Seeds the catalog on a brand-new database — themes, packages, cover
 * templates, default settings — so the app is usable straight after the host
 * provisions an empty one (as Render's free Postgres does when it expires and
 * the Blueprint recreates it). Each table is only filled while it's empty, so
 * themes or templates an admin deletes later don't come back on the next boot.
 * Each step is independent: a storage hiccup while rendering cover templates
 * must not stop themes and packages from being seeded.
 */
export async function ensureCatalog(): Promise<void> {
  const steps: Array<[string, () => Promise<boolean>, () => Promise<void>]> = [
    ['themes', () => isEmpty(notebookThemes), seedThemes],
    ['packages', () => isEmpty(packages), seedPackages],
    ['cover templates', () => isEmpty(coverTemplates), seedCoverTemplates],
  ];
  for (const [name, empty, seed] of steps) {
    try {
      if (await empty()) {
        await seed();
        console.log(`🌱 seeded ${name} on an empty database`);
      }
    } catch (error) {
      console.error(`❌ seeding ${name} failed`, error);
    }
  }
  try {
    await seedPlatformSettings(); // insert-if-missing per key
  } catch (error) {
    console.error('❌ seeding platform settings failed', error);
  }
}
