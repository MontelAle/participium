import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Boundary } from '../../common/entities/boundary.entity';
import { Category } from '../../common/entities/category.entity';
import { Report } from '../../common/entities/report.entity';
import { Session } from '../../common/entities/session.entity';
import { User } from '../../common/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Session, Category, User, Boundary])],
  controllers: [ReportsController],
  providers: [ReportsService, RolesGuard],
  exports: [ReportsService],
})
export class ReportsModule {}
