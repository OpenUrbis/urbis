import { TestBed } from '@angular/core/testing';

import { ProfileApi } from './profile-api';

describe('ProfileApi', () => {
  let service: ProfileApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfileApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
