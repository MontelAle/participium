import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, Account, Role, Session } from '@repo/api';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account, Role, Session])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
