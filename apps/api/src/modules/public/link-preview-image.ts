import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * Draws the 1200×630 card messengers show when a notebook link is shared:
 * the cover on the right (RTL start), the name, institution/year and a call
 * to action beside it, over a blurred copy of the cover (or the brand colour
 * when there's no cover to show). Text goes through sharp's Pango renderer,
 * which shapes Arabic properly with the bundled fonts.
 */

const WIDTH = 1200;
const HEIGHT = 630;
const PADDING = 64;
const BRAND_BG = { r: 92, g: 24, b: 32 }; // maroon-800
const GOLD = '#D9C09B';

// Resolved from this file (src/ or dist/ — same depth) to apps/api/assets/fonts.
const FONTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../assets/fonts');
const FONTS = {
  ruqaa: { file: path.join(FONTS_DIR, 'ArefRuqaa-Bold.ttf'), family: 'Aref Ruqaa Bold' },
  cairo: { file: path.join(FONTS_DIR, 'Cairo-Bold.ttf'), family: 'Cairo Bold' },
};

export interface PreviewCardInput {
  name: string;
  subtitle: string | null;
  callToAction: string;
  brand: string;
  cover: Buffer | null;
}

function escapeMarkup(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function renderText(
  text: string,
  font: keyof typeof FONTS,
  size: number,
  color: string,
  maxWidth: number,
): Promise<{ data: Buffer; width: number; height: number }> {
  const { data, info } = await sharp({
    text: {
      text: `<span foreground="${color}">${escapeMarkup(text)}</span>`,
      font: `${FONTS[font].family} ${size}`,
      fontfile: FONTS[font].file,
      rgba: true,
      width: maxWidth,
      wrap: 'word',
      align: 'right',
      dpi: 72,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

export async function renderPreviewCard(input: PreviewCardInput): Promise<Buffer> {
  const layers: sharp.OverlayOptions[] = [];

  const background = input.cover
    ? await sharp(input.cover).resize(WIDTH, HEIGHT, { fit: 'cover' }).blur(30).modulate({ brightness: 0.45 }).toBuffer()
    : await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: BRAND_BG } }).png().toBuffer();

  let textRight = WIDTH - PADDING;
  if (input.cover) {
    const cover = await sharp(input.cover)
      .resize({ height: HEIGHT - PADDING * 2, width: 380, fit: 'inside' })
      .toBuffer({ resolveWithObject: true });
    const left = WIDTH - PADDING - cover.info.width;
    layers.push({ input: cover.data, left, top: Math.round((HEIGHT - cover.info.height) / 2) });
    textRight = left - 56;
  }
  const textWidth = textRight - PADDING;

  const blocks = await Promise.all([
    renderText(input.brand, 'ruqaa', 40, GOLD, textWidth),
    renderText(input.name, 'ruqaa', input.name.length > 24 ? 64 : 84, '#FFFFFF', textWidth),
    input.subtitle ? renderText(input.subtitle, 'cairo', 30, '#F3E7D3', textWidth) : null,
    renderText(input.callToAction, 'cairo', 30, GOLD, textWidth),
  ]);
  const present = blocks.filter((b): b is NonNullable<typeof b> => b !== null);
  const gap = 18;
  const totalHeight = present.reduce((sum, b) => sum + b.height, 0) + gap * (present.length - 1);

  let top = Math.max(PADDING, Math.round((HEIGHT - totalHeight) / 2));
  for (const block of present) {
    layers.push({ input: block.data, left: Math.max(PADDING, textRight - block.width), top });
    top += block.height + gap;
  }

  return sharp(background).composite(layers).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}
