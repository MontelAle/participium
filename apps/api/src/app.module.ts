import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OfficesModule } from './modules/offices/offices.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './providers/database/database.module';
import { MinioModule } from './providers/minio/minio.module';

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
    NotificationsModule,
    CategoriesModule,
    OfficesModule,
    ProfilesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
