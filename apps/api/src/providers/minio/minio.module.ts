import { Module, Global } from '@nestjs/common';
import { MinioProvider } from './minio.provider';

@Global()
@Module({
  providers: [MinioProvider],
  exports: [MinioProvider],
})
export class MinioModule {}
