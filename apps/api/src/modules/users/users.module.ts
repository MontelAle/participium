import {
  Account,
  Category,
  Office,
  Profile,
  Report,
  Role,
  Session,
  User,
  UserOfficeRole,
} from '@entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsModule } from '../reports/reports.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Account,
      Profile,
      Role,
      Session,
      Office,
      Category,
      UserOfficeRole,
      Report,
    ]),
    ReportsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
})
export class UsersModule {}
