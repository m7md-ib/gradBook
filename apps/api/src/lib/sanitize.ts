import sanitizeHtml from 'sanitize-html';

/** Strips all HTML/scripts from user-generated text — messages are plain text only. */
export function sanitizePlainText(input: string): string {
  const withoutTags = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
  return withoutTags.trim().replace(/\s+\n/g, '\n');
}
