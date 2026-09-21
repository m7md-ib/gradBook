export interface UploadParams {
  key: string;
  buffer: Buffer;
  contentType: string;
}

export interface UploadResult {
  key: string;
  url: string;
}

export interface StorageProvider {
  upload(params: UploadParams): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
