import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { coverTemplates } from '../../db/schema/index.js';
import { getStorageProvider } from '../../storage/index.js';

interface CoverSourceFields {
  coverSourceType: 'template' | 'custom';
  coverImageKey: string | null;
  coverTemplateSlug: string | null;
}

/** A notebook's cover can come from an uploaded image or a pre-designed template;
 *  this resolves either into the one public URL the frontend needs to render it. */
export async function resolveCoverImageUrl(notebook: CoverSourceFields): Promise<string | null> {
  const storage = getStorageProvider();

  if (notebook.coverSourceType === 'custom' && notebook.coverImageKey) {
    return storage.getPublicUrl(notebook.coverImageKey);
  }

  if (notebook.coverSourceType === 'template' && notebook.coverTemplateSlug) {
    const template = await db.query.coverTemplates.findFirst({
      where: eq(coverTemplates.slug, notebook.coverTemplateSlug),
    });
    if (template) return storage.getPublicUrl(template.imageKey);
  }

  return null;
}
