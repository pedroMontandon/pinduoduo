import { NotifyGroupConfirmedUseCase } from '../../../src/modules/user/application/use-cases/notify-group-confirmed/notify-group-confirmed.use-case';

describe('NotifyGroupConfirmedUseCase', () => {
  let useCase: NotifyGroupConfirmedUseCase;

  beforeEach(() => {
    useCase = new NotifyGroupConfirmedUseCase();
  });

  it('executes without throwing for a standard confirmed group purchase', () => {
    expect(() =>
      useCase.execute('group-1', ['user-a', 'user-b', 'user-c'], 20),
    ).not.toThrow();
  });

  it('executes without throwing for a single participant', () => {
    expect(() => useCase.execute('group-solo', ['user-only'], 10)).not.toThrow();
  });

  it('executes without throwing when the participant list is empty', () => {
    expect(() => useCase.execute('group-empty', [], 15)).not.toThrow();
  });

  it('executes without throwing for a 0% discount', () => {
    expect(() => useCase.execute('group-no-discount', ['user-1'], 0)).not.toThrow();
  });
});
