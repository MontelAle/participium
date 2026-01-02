import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockGetMany = jest.fn();
  const mockWhere = jest.fn().mockReturnThis();
  const mockOrderBy = jest.fn().mockReturnThis();
  const mockAndWhere = jest.fn().mockReturnThis();

  const mockCreateQueryBuilder = jest.fn(() => ({
    where: mockWhere,
    orderBy: mockOrderBy,
    andWhere: mockAndWhere,
    getMany: mockGetMany,
  }));

  const mockFindOne = jest.fn();
  const mockSave = jest.fn();

  const mockRepository: any = {
    createQueryBuilder: mockCreateQueryBuilder,
    findOne: mockFindOne,
    save: mockSave,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(mockRepository);
  });

  it('findForUser should return results and not call andWhere when onlyUnread is false', async () => {
    const expected = [{ id: 'n1' }];
    mockGetMany.mockResolvedValueOnce(expected);

    const user: any = { id: 'user-1' };
    const result = await service.findForUser(user, false);

    expect(mockCreateQueryBuilder).toHaveBeenCalledWith('notification');
    expect(mockWhere).toHaveBeenCalled();
    expect(mockOrderBy).toHaveBeenCalled();
    expect(mockAndWhere).not.toHaveBeenCalled();
    expect(result).toBe(expected);
  });

  it('findForUser should add unread filter when onlyUnread is true', async () => {
    const expected = [{ id: 'n2' }];
    mockGetMany.mockResolvedValueOnce(expected);

    const user: any = { id: 'user-2' };
    const result = await service.findForUser(user, true);

    expect(mockCreateQueryBuilder).toHaveBeenCalledWith('notification');
    expect(mockAndWhere).toHaveBeenCalledWith('notification.read = false');
    expect(result).toBe(expected);
  });

  it('markAsRead should throw NotFoundException when notification not found', async () => {
    mockFindOne.mockResolvedValueOnce(undefined);
    const user: any = { id: 'u1' };
    await expect(service.markAsRead('not-exist', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('markAsRead should throw NotFoundException when notification belongs to another user', async () => {
    mockFindOne.mockResolvedValueOnce({
      id: 'n3',
      userId: 'other',
      read: false,
    });
    const user: any = { id: 'u2' };
    await expect(service.markAsRead('n3', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('markAsRead should mark notification as read and save it', async () => {
    const notif = { id: 'n4', userId: 'u3', read: false } as any;
    mockFindOne.mockResolvedValueOnce(notif);
    mockSave.mockResolvedValueOnce({ ...notif, read: true });

    const user: any = { id: 'u3' };
    const result = await service.markAsRead('n4', user);

    expect(mockFindOne).toHaveBeenCalledWith({ where: { id: 'n4' } });
    expect(mockSave).toHaveBeenCalled();
    expect(result.read).toBe(true);
  });

  it('findForUser should call where with correct userId parameter and order by createdAt DESC', async () => {
    const expected = [{ id: 'n5' }];
    mockGetMany.mockResolvedValueOnce(expected);

    const user: any = { id: 'user-5' };
    const result = await service.findForUser(user, false);

    expect(mockWhere).toHaveBeenCalledWith('notification.userId = :userId', {
      userId: 'user-5',
    });
    expect(mockOrderBy).toHaveBeenCalledWith('notification.createdAt', 'DESC');
    expect(result).toBe(expected);
  });

  it('markAsRead should save and return notification even if already read', async () => {
    const notif = { id: 'n6', userId: 'u6', read: true } as any;
    mockFindOne.mockResolvedValueOnce(notif);
    mockSave.mockResolvedValueOnce({ ...notif });

    const user: any = { id: 'u6' };
    const result = await service.markAsRead('n6', user);

    expect(mockFindOne).toHaveBeenCalledWith({ where: { id: 'n6' } });
    expect(mockSave).toHaveBeenCalledWith(notif);
    expect(result.read).toBe(true);
  });
});
