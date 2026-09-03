import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SignInApi } from './sign-in-api';

describe('SignInApi', () => {
  let service: SignInApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(SignInApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
