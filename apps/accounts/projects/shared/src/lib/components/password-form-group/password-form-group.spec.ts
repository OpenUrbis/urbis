import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { PasswordFormGroup } from './password-form-group';

describe('PasswordFormGroup', () => {
  let component: PasswordFormGroup;
  let fixture: ComponentFixture<PasswordFormGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordFormGroup, TranslateModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordFormGroup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
