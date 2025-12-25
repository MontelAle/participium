import { Account, Profile, Session, User } from '@entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, Session, User, Account])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
