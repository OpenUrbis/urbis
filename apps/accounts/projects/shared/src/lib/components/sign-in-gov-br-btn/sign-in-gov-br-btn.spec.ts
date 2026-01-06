import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { SignInGovBrBtn } from './sign-in-gov-br-btn';

describe('SignInGovBrBtn', () => {
  let component: SignInGovBrBtn;
  let fixture: ComponentFixture<SignInGovBrBtn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignInGovBrBtn, TranslateModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignInGovBrBtn);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
