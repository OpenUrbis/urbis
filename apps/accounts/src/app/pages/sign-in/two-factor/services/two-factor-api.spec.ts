import { TestBed } from '@angular/core/testing';

import { TwoFactorApi } from './two-factor-api';

describe('TwoFactorApi', () => {
  let service: TwoFactorApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TwoFactorApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
