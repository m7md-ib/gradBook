import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import type { StorageProvider, UploadParams, UploadResult } from './types.js';

/**
 * S3-compatible provider. Works with AWS S3, Cloudflare R2, and Supabase Storage's
 * S3-compatible endpoint — they all speak the same API, only the endpoint/region differ.
 */
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor() {
    if (!env.STORAGE_S3_BUCKET) {
      throw new Error('STORAGE_S3_BUCKET is required when STORAGE_PROVIDER is not "local"');
    }
    this.bucket = env.STORAGE_S3_BUCKET;
    this.publicBaseUrl = env.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, '');
    this.client = new S3Client({
      region: env.STORAGE_S3_REGION || 'auto',
      endpoint: env.STORAGE_S3_ENDPOINT,
      forcePathStyle: env.STORAGE_S3_FORCE_PATH_STYLE,
      credentials:
        env.STORAGE_S3_ACCESS_KEY_ID && env.STORAGE_S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID,
              secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  async upload({ key, buffer, contentType }: UploadParams): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return { key, url: this.getPublicUrl(key) };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}
