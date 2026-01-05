import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoFactorSetup } from './two-factor-setup';

describe('TwoFactorSetup', () => {
  let component: TwoFactorSetup;
  let fixture: ComponentFixture<TwoFactorSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoFactorSetup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TwoFactorSetup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
