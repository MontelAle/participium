import { Office, Session } from '@entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OfficesController } from './offices.controller';
import { OfficesService } from './offices.service';

@Module({
  imports: [TypeOrmModule.forFeature([Office, Session])],
  controllers: [OfficesController],
  providers: [OfficesService, RolesGuard],
})
export class OfficesModule {}
