import { Account, Profile, Role, Session, User } from '@entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionGuard } from './guards/session-auth.guard';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account, Session, Role, Profile])],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, SessionGuard],
})
export class AuthModule {}
