import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { RoleManagerApi } from './role-manager-api';

describe('RoleManagerApi', () => {
  let service: RoleManagerApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(RoleManagerApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
