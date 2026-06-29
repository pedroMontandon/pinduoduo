import { ListNotificationsUseCase } from '../../../src/modules/user/application/use-cases/list-notifications/list-notifications.use-case';
import { NotificationRepository } from '../../../src/modules/user/domain/repositories/notification.repository';
import { Notification } from '../../../src/modules/user/domain/entities/notification.entity';

describe('ListNotificationsUseCase', () => {
  let useCase: ListNotificationsUseCase;
  let repo: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    repo = {
      saveAll: jest.fn(),
      findByUserId: jest.fn(),
      countUnread: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };
    useCase = new ListNotificationsUseCase(repo);
  });

  it('returns a paginated list scoped to the user', async () => {
    const notification = Notification.create({
      userId: 'user-1',
      message: 'hello',
      groupPurchaseId: 'gp-1',
    });
    repo.findByUserId.mockResolvedValue({ items: [notification], total: 1 });

    const result = await useCase.execute('user-1', { skip: 0, take: 10 });

    expect(repo.findByUserId).toHaveBeenCalledWith('user-1', { skip: 0, take: 10 });
    expect(result.total).toBe(1);
    expect(result.skip).toBe(0);
    expect(result.take).toBe(10);
    expect(result.items[0]).toEqual({
      id: notification.id,
      message: 'hello',
      groupPurchaseId: 'gp-1',
      read: false,
      createdAt: notification.createdAt,
    });
  });

  it('applies default pagination when not provided', async () => {
    repo.findByUserId.mockResolvedValue({ items: [], total: 0 });

    await useCase.execute('user-1', {});

    expect(repo.findByUserId).toHaveBeenCalledWith('user-1', { skip: 0, take: 10 });
  });
});
