import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { mkdir, writeFile, readFile, unlink, stat, access } from 'fs/promises';
import { join, dirname } from 'path';
import {
  IStorageService,
  StorageUploadResult,
  StorageSignedUrlResult,
  StorageMetadata,
} from './storage.interface';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly baseDir: string;

  constructor(private readonly configService: ConfigService) {
    this.baseDir = this.configService.get<string>('LOCAL_STORAGE_DIR', './storage');
  }

  private getFullPath(storageKey: string): string {
    return join(this.baseDir, storageKey);
  }

  async upload(file: Express.Multer.File, storageKey: string): Promise<StorageUploadResult> {
    const fullPath = this.getFullPath(storageKey);
    const dir = dirname(fullPath);

    await mkdir(dir, { recursive: true });

    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    await writeFile(fullPath, file.buffer);

    this.logger.log(`File uploaded locally: ${storageKey}`);

    return {
      storageKey,
      fileSize: file.size,
      mimeType: file.mimetype,
      checksum,
    };
  }

  async download(storageKey: string): Promise<Buffer> {
    const fullPath = this.getFullPath(storageKey);

    try {
      return await readFile(fullPath);
    } catch {
      throw new Error(`File not found: ${storageKey}`);
    }
  }

  async delete(storageKey: string): Promise<void> {
    const fullPath = this.getFullPath(storageKey);

    try {
      await unlink(fullPath);
      this.logger.log(`File deleted locally: ${storageKey}`);
    } catch {
      this.logger.warn(`File not found for deletion: ${storageKey}`);
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    const fullPath = this.getFullPath(storageKey);

    try {
      await access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(storageKey: string, expiresInMinutes = 60): Promise<StorageSignedUrlResult> {
    const fullPath = this.getFullPath(storageKey);

    try {
      await access(fullPath);
    } catch {
      throw new Error(`File not found: ${storageKey}`);
    }

    return {
      url: `/storage/${storageKey}`,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    };
  }

  async getMetadata(storageKey: string): Promise<StorageMetadata> {
    const fullPath = this.getFullPath(storageKey);

    try {
      const fileStat = await stat(fullPath);
      return {
        storageKey,
        fileSize: fileStat.size,
        mimeType: 'application/octet-stream',
        lastModified: fileStat.mtime,
      };
    } catch {
      throw new Error(`File not found: ${storageKey}`);
    }
  }
}
