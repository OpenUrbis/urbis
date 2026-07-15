import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PublicLayout } from './public-layout';
import { WhitelabelState } from '../../../states/whitelabel/whitelabel.state';
import { ProfileState } from '../../../states/profile/profile.state';
import { AuthState } from '../../../states/auth/auth.state';
import { OrganizationState } from '../../../states/organization/organization.state';
import { provideAuth } from 'angular-auth-oidc-client';

describe('PublicLayout', () => {
  let component: PublicLayout;
  let fixture: ComponentFixture<PublicLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicLayout],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAuth({
          config: {
            authority: 'https://mock.authority',
            redirectUrl: 'https://mock.redirect',
            clientId: 'mock-client',
            scope: 'openid profile',
            responseType: 'code',
          }
        }),
        { provide: WhitelabelState, useValue: { value: () => ({}) } },
        { provide: ProfileState, useValue: { value: () => ({}) } },
        { provide: AuthState, useValue: { isAuthenticated: () => false } },
        { provide: OrganizationState, useValue: { clearSelectedOrganization: () => {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
