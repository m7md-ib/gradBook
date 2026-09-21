import { env } from '../config/env.js';
import { LocalStorageProvider } from './local-provider.js';
import { S3StorageProvider } from './s3-provider.js';
import type { StorageProvider } from './types.js';

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (instance) return instance;

  switch (env.STORAGE_PROVIDER) {
    case 'local':
      instance = new LocalStorageProvider();
      break;
    case 's3':
    case 'r2':
    case 'supabase':
      instance = new S3StorageProvider();
      break;
    default:
      throw new Error(`Unsupported storage provider: ${env.STORAGE_PROVIDER satisfies never}`);
  }

  return instance;
}

export type { StorageProvider, UploadParams, UploadResult } from './types.js';
