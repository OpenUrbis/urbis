import { TwoFactorGuard } from './two-factor.guard';

describe('TwoFactorGuard', () => {
  it('should be defined', () => {
    expect(new TwoFactorGuard()).toBeDefined();
  });
});
