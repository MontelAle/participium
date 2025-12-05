import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile, Session } from '@repo/api';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, Session])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
