import { ApiError } from '../../lib/errors.js';
import type { Notebook } from '../../db/schema/notebooks.js';

export function assertNotebookOwner(notebook: Notebook | undefined, userId: string, isAdmin = false): Notebook {
  if (!notebook) throw ApiError.notFound('الدفتر غير موجود');
  if (notebook.ownerUserId !== userId && !isAdmin) {
    throw ApiError.forbidden('لا تملك صلاحية الوصول لهذا الدفتر');
  }
  return notebook;
}
