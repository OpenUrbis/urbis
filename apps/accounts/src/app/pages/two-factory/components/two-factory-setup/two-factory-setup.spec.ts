import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoFactorySetup } from './two-factory-setup';

describe('TwoFactorySetup', () => {
  let component: TwoFactorySetup;
  let fixture: ComponentFixture<TwoFactorySetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoFactorySetup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TwoFactorySetup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
