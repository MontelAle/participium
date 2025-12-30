import { Notification } from '@entities';
import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { RequestWithUserSession } from '../../common/types/request-with-user-session.type';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@ApiCookieAuth('session_token')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(SessionGuard)
  async list(
    @Request() req: RequestWithUserSession,
    @Query('unread') unread?: string,
  ): Promise<{ success: boolean; data: Notification[] }> {
    const onlyUnread = unread === '1' || unread === 'true';
    const items = await this.notificationsService.findForUser(
      req.user,
      onlyUnread,
    );
    return { success: true, data: items };
  }

  @Patch(':id/read')
  @UseGuards(SessionGuard)
  async markRead(
    @Param('id') id: string,
    @Request() req: RequestWithUserSession,
  ): Promise<{ success: boolean; data: Notification }> {
    const item = await this.notificationsService.markAsRead(id, req.user);
    return { success: true, data: item };
  }
}
