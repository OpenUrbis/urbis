import { TestBed } from '@angular/core/testing';

import { UsersApi } from './users-api';

describe('UsersApi', () => {
  let service: UsersApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsersApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
