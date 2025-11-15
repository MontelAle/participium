import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Role } from '../../common/entities/role.entity';
import { Session } from '../../common/entities/session.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Session])],
  controllers: [RolesController],
  providers: [RolesService, RolesGuard],
})
export class RolesModule {}
