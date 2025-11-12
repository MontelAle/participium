import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report, Session } from '@repo/api';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Session])],
  controllers: [ReportsController],
  providers: [ReportsService, RolesGuard],
  exports: [ReportsService],
})
export class ReportsModule {}
