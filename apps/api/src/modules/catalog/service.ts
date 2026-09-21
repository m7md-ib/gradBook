import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { notebookThemes, coverTemplates, packages } from '../../db/schema/index.js';
import { getStorageProvider } from '../../storage/index.js';

export async function listThemes() {
  return db.query.notebookThemes.findMany({
    where: eq(notebookThemes.active, true),
    orderBy: [asc(notebookThemes.nameEn)],
  });
}

export async function listCoverTemplates() {
  const storage = getStorageProvider();
  const rows = await db.query.coverTemplates.findMany({
    where: eq(coverTemplates.active, true),
    orderBy: [asc(coverTemplates.sortOrder)],
  });
  return rows.map((row) => ({
    ...row,
    imageUrl: storage.getPublicUrl(row.imageKey),
    thumbnailUrl: storage.getPublicUrl(row.thumbnailKey),
  }));
}

export async function listPackages() {
  return db.query.packages.findMany({
    where: eq(packages.active, true),
    orderBy: [asc(packages.sortOrder)],
  });
}
