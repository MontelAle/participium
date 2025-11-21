import { Module } from '@nestjs/common';
import { DatabaseModule } from './providers/database/database.module';
import { MinioModule } from './providers/minio/minio.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ConfigModule } from '@nestjs/config';
import { CategoriesModule } from './modules/categories/categories.module';

import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    DatabaseModule,
    MinioModule,
    AuthModule,
    RolesModule,
    UsersModule,
    ReportsModule,
    CategoriesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
