import { TestBed } from '@angular/core/testing';

import { TwoFactoryApi } from './two-factory-api';

describe('TwoFactoryApi', () => {
  let service: TwoFactoryApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TwoFactoryApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
