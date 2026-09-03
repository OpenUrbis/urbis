import { TestBed } from '@angular/core/testing';
import { AccessTokenInterceptor } from './access-token-interceptor';
import { OidcSecurityService } from 'angular-auth-oidc-client';

describe('AccessTokenInterceptor', () => {
  let interceptor: AccessTokenInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccessTokenInterceptor,
        {
          provide: OidcSecurityService,
          useValue: {},
        },
      ],
    });
    interceptor = TestBed.inject(AccessTokenInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
