import { Account, Profile, Role, Session, User } from '@entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionGuard } from './guards/session-auth.guard';
import { OtpService } from './otp.service';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, Session, Role, Profile]),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, SessionGuard, OtpService],
})
export class AuthModule {}
