import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../../common/entities/profile.entity';
import { Session } from '../../common/entities/session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, Session])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
