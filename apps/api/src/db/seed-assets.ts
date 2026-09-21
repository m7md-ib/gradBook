import sharp from 'sharp';

/**
 * Generates a soft gradient placeholder image (no external network calls, no
 * stock photography licensing concerns) for demo covers/profiles/gallery items.
 * The graduate's real name/title are rendered by the frontend as an overlay,
 * so the image itself is intentionally abstract.
 */
export async function renderGradientImage(
  width: number,
  height: number,
  from: string,
  to: string,
): Promise<Buffer> {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${from}" />
        <stop offset="100%" stop-color="${to}" />
      </linearGradient>
      <radialGradient id="r" cx="28%" cy="18%" r="75%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="r2" cx="80%" cy="90%" r="60%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.12" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)" />
    <rect width="100%" height="100%" fill="url(#r)" />
    <rect width="100%" height="100%" fill="url(#r2)" />
  </svg>`;

  return sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
}
