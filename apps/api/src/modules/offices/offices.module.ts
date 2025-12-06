import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Office } from '../../common/entities/office.entity';
import { Session } from '../../common/entities/session.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OfficesController } from './offices.controller';
import { OfficesService } from './offices.service';

@Module({
  imports: [TypeOrmModule.forFeature([Office, Session])],
  controllers: [OfficesController],
  providers: [OfficesService, RolesGuard],
})
export class OfficesModule {}
