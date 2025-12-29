import { Notification, User } from '@entities';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findForUser(user: User, onlyUnread = false): Promise<Notification[]> {
    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId: user.id })
      .orderBy('notification.createdAt', 'DESC');

    if (onlyUnread) qb.andWhere('notification.read = false');

    return qb.getMany();
  }

  async markAsRead(id: string, user: User): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification || notification.userId !== user.id) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    return this.notificationRepository.save(notification);
  }
}
