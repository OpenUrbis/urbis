import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ProfileApi } from './profile-api';

describe('ProfileApi', () => {
  let service: ProfileApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ProfileApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
