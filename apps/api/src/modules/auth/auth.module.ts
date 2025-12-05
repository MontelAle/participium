import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../../common/entities/user.entity';
import { Account } from '../../common/entities/account.entity';
import { Session } from '../../common/entities/session.entity';
import { Role } from '../../common/entities/role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from './strategies/local.strategy';
import { SessionGuard } from './guards/session-auth.guard';
import { Profile } from '../../common/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account, Session, Role, Profile])],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, SessionGuard],
})
export class AuthModule {}
