import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../../common/entities/user.entity';
import { Account } from '../../common/entities/account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionSerializer } from './serializer.provider';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account])],
  controllers: [AuthController],
  providers: [AuthService, SessionSerializer],
})
export class AuthModule {}
