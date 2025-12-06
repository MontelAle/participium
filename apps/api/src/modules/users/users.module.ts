import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../../common/entities/account.entity';
import { Office } from '../../common/entities/office.entity';
import { Role } from '../../common/entities/role.entity';
import { Session } from '../../common/entities/session.entity';
import { User } from '../../common/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account, Role, Session, Office])],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
})
export class UsersModule {}
