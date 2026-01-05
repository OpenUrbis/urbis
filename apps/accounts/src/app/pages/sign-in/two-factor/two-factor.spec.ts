import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoFactor } from './two-factor';

describe('TwoFactor', () => {
  let component: TwoFactor;
  let fixture: ComponentFixture<TwoFactor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoFactor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TwoFactor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
