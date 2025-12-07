import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../../common/entities/profile.entity';
import { Session } from '../../common/entities/session.entity';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, Session, User,Account])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
