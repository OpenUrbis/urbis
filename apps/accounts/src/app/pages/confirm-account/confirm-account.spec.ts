import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmAccount } from './confirm-account';

describe('ConfirmAccount', () => {
  let component: ConfirmAccount;
  let fixture: ComponentFixture<ConfirmAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmAccount, HttpClientTestingModule, RouterTestingModule, TranslateModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmAccount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
