import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, Account, Session, Role } from '@repo/api';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from './strategies/local.strategy';
import { SessionGuard } from './guards/session-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account, Session, Role])],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, SessionGuard],
})
export class AuthModule {}
