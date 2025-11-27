import { Module } from '@nestjs/common';
import { OfficesService } from './offices.service';
import { OfficesController } from './offices.controller';
import { Session } from '../../common/entities/session.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Office } from '../../common/entities/office.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Office, Session])],
  controllers: [OfficesController],
  providers: [OfficesService, RolesGuard],
})
export class OfficesModule {}
