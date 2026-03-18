import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { of } from 'rxjs';

import { Callback } from './callback';

describe('Callback', () => {
  let component: Callback;
  let fixture: ComponentFixture<Callback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Callback, TranslateModule.forRoot(), HttpClientTestingModule, RouterTestingModule],
      providers: [
        {
          provide: OidcSecurityService,
          useValue: {
            checkAuthMultiple: () => of([{ isAuthenticated: true, userData: {}, errorMessage: null, configId: 'configId' }])
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Callback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
