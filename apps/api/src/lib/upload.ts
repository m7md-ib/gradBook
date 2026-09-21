import multer from 'multer';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { UPLOAD_LIMITS } from '@daftar/shared';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';
import { getStorageProvider } from '../storage/index.js';

const ALLOWED = new Set<string>(UPLOAD_LIMITS.allowedImageMimeTypes);

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.STORAGE_MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(ApiError.badRequest('صيغة الصورة غير مدعومة (JPEG أو PNG أو WebP فقط)'));
      return;
    }
    cb(null, true);
  },
});

export interface ProcessedImage {
  key: string;
  url: string;
  width: number;
  height: number;
}

/**
 * Validates the buffer is really an image (magic-byte sniffed by sharp, not just
 * the client-supplied mimetype), re-encodes it to strip any embedded scripts/exif,
 * downsizes it, and stores both a full and a thumbnail variant.
 */
export async function processAndStoreImage(
  buffer: Buffer,
  folder: string,
  options: { maxWidth?: number; makeThumbnail?: boolean } = {},
): Promise<ProcessedImage & { thumbnailUrl?: string }> {
  const { maxWidth = 1600, makeThumbnail = false } = options;
  const storage = getStorageProvider();

  let pipeline: sharp.Sharp;
  let metadata: sharp.Metadata;
  try {
    pipeline = sharp(buffer, { failOn: 'error' }).rotate();
    metadata = await pipeline.metadata();
  } catch {
    throw ApiError.badRequest('الملف المرفوع ليس صورة صالحة');
  }

  if (!metadata.width || !metadata.height) {
    throw ApiError.badRequest('تعذّرت قراءة أبعاد الصورة');
  }

  const id = crypto.randomUUID();
  const resized = pipeline
    .resize({ width: Math.min(maxWidth, metadata.width), withoutEnlargement: true })
    .webp({ quality: 82 });
  const outputBuffer = await resized.toBuffer();
  const outputMeta = await sharp(outputBuffer).metadata();

  const { url, key } = await storage.upload({
    key: `${folder}/${id}.webp`,
    buffer: outputBuffer,
    contentType: 'image/webp',
  });

  let thumbnailUrl: string | undefined;
  if (makeThumbnail) {
    const thumbBuffer = await sharp(buffer).rotate().resize({ width: 320 }).webp({ quality: 75 }).toBuffer();
    const thumb = await storage.upload({
      key: `${folder}/${id}-thumb.webp`,
      buffer: thumbBuffer,
      contentType: 'image/webp',
    });
    thumbnailUrl = thumb.url;
  }

  return {
    key,
    url,
    width: outputMeta.width ?? 0,
    height: outputMeta.height ?? 0,
    thumbnailUrl,
  };
}
