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
    this.publicBaseUrl = this.resolvePublicBaseUrl();
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

  /**
   * Supabase's S3-compatible upload endpoint and its public object URL both
   * encode the same project ref, just under different subdomains/paths
   * (<ref>.storage.supabase.co/storage/v1/s3 vs. <ref>.supabase.co/storage/v1/object/public/<bucket>)
   * — deriving one from the other removes a second manually-typed URL that
   * has to be kept in sync by hand (STORAGE_PUBLIC_BASE_URL), and a typo in
   * it previously broke every image/QR URL with no error until the browser
   * tried to load one.
   */
  private resolvePublicBaseUrl(): string {
    if (env.STORAGE_PROVIDER === 'supabase') {
      if (!env.STORAGE_S3_ENDPOINT) {
        throw new Error('STORAGE_S3_ENDPOINT is required when STORAGE_PROVIDER=supabase');
      }
      const endpointHost = new URL(env.STORAGE_S3_ENDPOINT).host;
      const projectHost = endpointHost.replace(/^([^.]+)\.storage\.supabase\.co$/, '$1.supabase.co');
      return `https://${projectHost}/storage/v1/object/public/${this.bucket}`;
    }
    return env.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, '');
  }
}
