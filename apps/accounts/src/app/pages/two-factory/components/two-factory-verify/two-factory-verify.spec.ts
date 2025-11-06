import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoFactoryVerify } from './two-factory-verify';

describe('TwoFactoryVerify', () => {
  let component: TwoFactoryVerify;
  let fixture: ComponentFixture<TwoFactoryVerify>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoFactoryVerify]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TwoFactoryVerify);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
