import { NotifyGroupConfirmedUseCase } from '../../../src/modules/user/application/use-cases/notify-group-confirmed/notify-group-confirmed.use-case';
import { NotificationRepository } from '../../../src/modules/user/domain/repositories/notification.repository';

describe('NotifyGroupConfirmedUseCase', () => {
  let useCase: NotifyGroupConfirmedUseCase;
  let repo: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    repo = {
      saveAll: jest.fn().mockResolvedValue(undefined),
      findByUserId: jest.fn(),
      countUnread: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };
    useCase = new NotifyGroupConfirmedUseCase(repo);
  });

  it('persists one notification per participant', async () => {
    await useCase.execute('group-1', ['user-a', 'user-b', 'user-c'], 20);

    expect(repo.saveAll).toHaveBeenCalledTimes(1);
    const saved = repo.saveAll.mock.calls[0][0];
    expect(saved).toHaveLength(3);
    expect(saved.map(n => n.userId)).toEqual(['user-a', 'user-b', 'user-c']);
    expect(saved.every(n => n.groupPurchaseId === 'group-1')).toBe(true);
    expect(saved.every(n => n.read === false)).toBe(true);
    expect(saved.every(n => n.message.includes('20'))).toBe(true);
  });

  it('persists a single notification for a single participant', async () => {
    await useCase.execute('group-solo', ['user-only'], 10);

    const saved = repo.saveAll.mock.calls[0][0];
    expect(saved).toHaveLength(1);
    expect(saved[0].userId).toBe('user-only');
  });

  it('saves an empty list when there are no participants', async () => {
    await expect(useCase.execute('group-empty', [], 15)).resolves.not.toThrow();
    expect(repo.saveAll).toHaveBeenCalledWith([]);
  });

  it('executes without throwing for a 0% discount', async () => {
    await expect(useCase.execute('group-no-discount', ['user-1'], 0)).resolves.not.toThrow();
  });
});
