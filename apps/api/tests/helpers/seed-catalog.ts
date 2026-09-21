import { DEFAULT_PACKAGES, DEFAULT_THEMES } from '@daftar/shared';
import { db } from '../../src/db/client.js';
import { notebookThemes, packages } from '../../src/db/schema/index.js';

let seeded = false;

/** Notebook/order creation both require a valid theme/package to exist — this
 *  makes sure the minimal catalog rows are present without depending on the
 *  full demo seed script. Idempotent, so it's safe to call from every test file. */
export async function ensureCatalogSeeded() {
  if (seeded) return;

  for (const theme of DEFAULT_THEMES) {
    await db
      .insert(notebookThemes)
      .values({
        slug: theme.slug,
        category: theme.category,
        nameAr: theme.nameAr,
        nameEn: theme.nameEn,
        paperColor: theme.paperColor,
        accentColor: theme.accentColor,
        inkColor: theme.inkColor,
        headingFont: theme.headingFont,
        bodyFont: theme.bodyFont,
        coverGradientFrom: theme.coverGradient[0],
        coverGradientTo: theme.coverGradient[1],
      })
      .onConflictDoNothing({ target: notebookThemes.slug });
  }

  for (const pkg of DEFAULT_PACKAGES) {
    await db
      .insert(packages)
      .values({
        tier: pkg.tier,
        slug: pkg.slug,
        nameAr: pkg.nameAr,
        nameEn: pkg.nameEn,
        descriptionAr: pkg.descriptionAr,
        descriptionEn: pkg.descriptionEn,
        priceCents: pkg.priceCents,
        currency: pkg.currency,
        duration: pkg.duration,
        maxGraduates: pkg.maxGraduates,
        maxMessages: pkg.maxMessages,
        maxGalleryItems: pkg.maxGalleryItems,
        features: pkg.features,
        sortOrder: pkg.sortOrder,
      })
      .onConflictDoNothing({ target: packages.slug });
  }

  seeded = true;
}
