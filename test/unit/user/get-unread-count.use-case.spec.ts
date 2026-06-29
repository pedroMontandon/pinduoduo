import { GetUnreadCountUseCase } from '../../../src/modules/user/application/use-cases/get-unread-count/get-unread-count.use-case';
import { NotificationRepository } from '../../../src/modules/user/domain/repositories/notification.repository';

describe('GetUnreadCountUseCase', () => {
  let useCase: GetUnreadCountUseCase;
  let repo: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    repo = {
      saveAll: jest.fn(),
      findByUserId: jest.fn(),
      countUnread: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };
    useCase = new GetUnreadCountUseCase(repo);
  });

  it('returns the unread count for the user', async () => {
    repo.countUnread.mockResolvedValue(4);

    const result = await useCase.execute('user-1');

    expect(repo.countUnread).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ count: 4 });
  });
});
