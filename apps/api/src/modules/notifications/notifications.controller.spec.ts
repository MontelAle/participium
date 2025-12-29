import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockService = {
    findForUser: jest.fn(),
    markAsRead: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new NotificationsController(mockService);
  });

  it('list should call service.findForUser with onlyUnread=false when query not provided', async () => {
    const req: any = { user: { id: 'u1' } };
    const items = [{ id: 'a' }];
    mockService.findForUser.mockResolvedValueOnce(items);

    const res = await controller.list(req, undefined);

    expect(mockService.findForUser).toHaveBeenCalledWith(req.user, false);
    expect(res).toEqual({ success: true, data: items });
  });

  it('list should treat unread="1" as onlyUnread=true', async () => {
    const req: any = { user: { id: 'u2' } };
    const items = [{ id: 'b' }];
    mockService.findForUser.mockResolvedValueOnce(items);

    const res = await controller.list(req, '1');

    expect(mockService.findForUser).toHaveBeenCalledWith(req.user, true);
    expect(res).toEqual({ success: true, data: items });
  });

  it('markRead should call service.markAsRead and return success', async () => {
    const req: any = { user: { id: 'u3' } };
    const item = { id: 'n1', read: true };
    mockService.markAsRead.mockResolvedValueOnce(item);

    const res = await controller.markRead('n1', req);

    expect(mockService.markAsRead).toHaveBeenCalledWith('n1', req.user);
    expect(res).toEqual({ success: true, data: item });
  });
});
