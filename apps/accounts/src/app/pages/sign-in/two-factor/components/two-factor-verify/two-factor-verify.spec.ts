import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoFactorVerify } from './two-factor-verify';

describe('TwoFactorVerify', () => {
  let component: TwoFactorVerify;
  let fixture: ComponentFixture<TwoFactorVerify>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoFactorVerify]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TwoFactorVerify);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
