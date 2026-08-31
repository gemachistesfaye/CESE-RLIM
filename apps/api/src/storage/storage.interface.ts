export interface StorageUploadResult {
  storageKey: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
}

export interface StorageSignedUrlResult {
  url: string;
  expiresAt: Date;
}

export interface StorageMetadata {
  storageKey: string;
  fileSize: number;
  mimeType: string;
  lastModified: Date;
}

export interface IStorageService {
  upload(file: Express.Multer.File, storageKey: string): Promise<StorageUploadResult>;
  download(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
  exists(storageKey: string): Promise<boolean>;
  getSignedUrl(storageKey: string, expiresInMinutes?: number): Promise<StorageSignedUrlResult>;
  getMetadata(storageKey: string): Promise<StorageMetadata>;
}
