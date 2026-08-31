import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import {
  IStorageService,
  StorageUploadResult,
  StorageSignedUrlResult,
  StorageMetadata,
} from './storage.interface';

@Injectable()
export class SupabaseStorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private supabase!: SupabaseClient;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('STORAGE_BUCKET', 'research-documents');
  }

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      this.logger.warn(
        'Supabase storage credentials not configured. Supabase storage will not be available.',
      );
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.logger.log('Supabase storage client initialized');
  }

  private ensureInitialized(): void {
    if (!this.supabase) {
      throw new Error(
        'Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.',
      );
    }
  }

  async upload(file: Express.Multer.File, storageKey: string): Promise<StorageUploadResult> {
    this.ensureInitialized();

    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(storageKey, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Upload failed for ${storageKey}: ${error.message}`);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    return {
      storageKey,
      fileSize: file.size,
      mimeType: file.mimetype,
      checksum,
    };
  }

  async download(storageKey: string): Promise<Buffer> {
    this.ensureInitialized();

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(storageKey);

    if (error) {
      this.logger.error(`Download failed for ${storageKey}: ${error.message}`);
      throw new Error(`Storage download failed: ${error.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(storageKey: string): Promise<void> {
    this.ensureInitialized();

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([storageKey]);

    if (error) {
      this.logger.error(`Delete failed for ${storageKey}: ${error.message}`);
      throw new Error(`Storage delete failed: ${error.message}`);
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    this.ensureInitialized();

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .list(storageKey.split('/').slice(0, -1).join('/'), {
        search: storageKey.split('/').pop(),
      });

    if (error) {
      this.logger.error(`Exists check failed for ${storageKey}: ${error.message}`);
      return false;
    }

    return true;
  }

  async getSignedUrl(storageKey: string, expiresInMinutes = 60): Promise<StorageSignedUrlResult> {
    this.ensureInitialized();

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(storageKey, expiresInMinutes * 60);

    if (error) {
      this.logger.error(`Signed URL generation failed for ${storageKey}: ${error.message}`);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }

    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    };
  }

  async getMetadata(storageKey: string): Promise<StorageMetadata> {
    this.ensureInitialized();

    const fileName = storageKey.split('/').pop() || '';
    const directory = storageKey.split('/').slice(0, -1).join('/');

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list(directory, { search: fileName });

    if (error || !data || data.length === 0) {
      throw new Error(`Metadata retrieval failed for ${storageKey}`);
    }

    const file = data.find((f) => f.name === fileName);
    if (!file) {
      throw new Error(`File not found: ${storageKey}`);
    }

    return {
      storageKey,
      fileSize: file.metadata?.size || 0,
      mimeType: file.metadata?.mimetype || 'application/octet-stream',
      lastModified: new Date(file.updated_at || file.created_at || Date.now()),
    };
  }
}
