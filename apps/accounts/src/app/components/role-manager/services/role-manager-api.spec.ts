import { TestBed } from '@angular/core/testing';

import { RoleManagerApi } from './role-manager-api';

describe('RoleManagerApi', () => {
  let service: RoleManagerApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoleManagerApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
