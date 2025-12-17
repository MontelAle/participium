import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../../common/entities/account.entity';
import { Profile } from '../../common/entities/profile.entity';
import { Role } from '../../common/entities/role.entity';
import { Session } from '../../common/entities/session.entity';
import { User } from '../../common/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionGuard } from './guards/session-auth.guard';
import { PublicGuard } from './guards/public.guard';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account, Session, Role, Profile])],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, SessionGuard, PublicGuard],
  exports: [SessionGuard, PublicGuard],
})
export class AuthModule {}
