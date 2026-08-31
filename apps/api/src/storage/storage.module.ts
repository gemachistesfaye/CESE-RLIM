import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseStorageService } from './supabase-storage.service';
import { LocalStorageService } from './local-storage.service';

export const STORAGE_SERVICE_TOKEN = 'StorageService';

const storageFactory: Provider = {
  provide: STORAGE_SERVICE_TOKEN,
  useFactory: (configService: ConfigService) => {
    const provider = configService.get<string>('STORAGE_PROVIDER', 'local');

    if (provider === 'supabase') {
      return new SupabaseStorageService(configService);
    }

    return new LocalStorageService(configService);
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [storageFactory],
  exports: [STORAGE_SERVICE_TOKEN],
})
export class StorageModule {}
