import { Account, Profile, Session, User } from '@entities';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, Session, User, Account]),
    forwardRef(() => TelegramModule),
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
