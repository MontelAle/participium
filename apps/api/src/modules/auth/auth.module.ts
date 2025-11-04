import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, Account, Role } from '@repo/api';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionSerializer } from './providers/serializer.provider';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account, Role])],
  controllers: [AuthController],
  providers: [AuthService, SessionSerializer, LocalStrategy],
})
export class AuthModule {}
