import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Role, Session } from '@repo/api';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Session])],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
