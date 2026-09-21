import { promises as fs } from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import type { StorageProvider, UploadParams, UploadResult } from './types.js';

/** Stores files on local disk. Suitable for development and small self-hosted deployments. */
export class LocalStorageProvider implements StorageProvider {
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor(rootDir = env.STORAGE_LOCAL_DIR, publicBaseUrl = env.STORAGE_PUBLIC_BASE_URL) {
    this.rootDir = path.resolve(rootDir);
    this.publicBaseUrl = publicBaseUrl.replace(/\/$/, '');
  }

  async upload({ key, buffer }: UploadParams): Promise<UploadResult> {
    const safeKey = normalizeKey(key);
    const destination = path.join(this.rootDir, safeKey);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, buffer);
    return { key: safeKey, url: this.getPublicUrl(safeKey) };
  }

  async delete(key: string): Promise<void> {
    const safeKey = normalizeKey(key);
    const target = path.join(this.rootDir, safeKey);
    await fs.rm(target, { force: true });
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${normalizeKey(key)}`;
  }
}

/** Prevents path traversal outside the storage root. */
function normalizeKey(key: string): string {
  const normalized = path.posix.normalize(key).replace(/^(\.\.[/\\])+/, '');
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    throw new Error('Invalid storage key');
  }
  return normalized;
}
