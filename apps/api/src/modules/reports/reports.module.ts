import { Boundary, Category, Report, Session, User } from '@entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, Session, Category, User, Boundary]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, RolesGuard],
  exports: [ReportsService],
})
export class ReportsModule {}
