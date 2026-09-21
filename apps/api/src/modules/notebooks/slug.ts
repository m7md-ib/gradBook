import { eq } from 'drizzle-orm';
import { slugify } from '@daftar/shared';
import { db } from '../../db/client.js';
import { notebooks } from '../../db/schema/index.js';

export async function generateUniqueNotebookSlug(base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let attempt = 1;

  while (await db.query.notebooks.findFirst({ where: eq(notebooks.slug, candidate) })) {
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }

  return candidate;
}
