import { TwoFactorGuard } from './two-factor.guard';

describe('TwoFactorGuard', () => {
  it('should be defined', () => {
    // Provide the required 3 arguments (can use suitable mocks or nulls for testing)
    expect(new TwoFactorGuard(null, null, null)).toBeDefined();
  });
});
