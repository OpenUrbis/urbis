import { TestBed } from '@angular/core/testing';

import { SignInApi } from './sign-in-api';

describe('SignInApi', () => {
  let service: SignInApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignInApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
