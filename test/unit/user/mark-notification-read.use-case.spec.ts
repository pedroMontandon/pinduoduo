import { MarkNotificationReadUseCase } from '../../../src/modules/user/application/use-cases/mark-notification-read/mark-notification-read.use-case';
import { NotificationRepository } from '../../../src/modules/user/domain/repositories/notification.repository';

describe('MarkNotificationReadUseCase', () => {
  let useCase: MarkNotificationReadUseCase;
  let repo: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    repo = {
      saveAll: jest.fn(),
      findByUserId: jest.fn(),
      countUnread: jest.fn(),
      markAsRead: jest.fn().mockResolvedValue(undefined),
      markAllAsRead: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new MarkNotificationReadUseCase(repo);
  });

  it('marks a single notification as read, scoped to the user', async () => {
    await useCase.execute('user-1', 'notif-1');
    expect(repo.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
  });

  it('marks all notifications as read for the user', async () => {
    await useCase.markAll('user-1');
    expect(repo.markAllAsRead).toHaveBeenCalledWith('user-1');
  });
});
