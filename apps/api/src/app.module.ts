import { Module } from '@nestjs/common';
import { DatabaseModule } from './providers/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
