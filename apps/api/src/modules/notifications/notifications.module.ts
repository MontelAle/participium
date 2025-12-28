import { Notification, Session, User } from '@entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Session])],
  controllers: [NotificationsController],
  providers: [NotificationsService, RolesGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
