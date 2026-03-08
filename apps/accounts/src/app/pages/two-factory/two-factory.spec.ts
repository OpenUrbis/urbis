import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoFactory } from './two-factory';

describe('TwoFactory', () => {
  let component: TwoFactory;
  let fixture: ComponentFixture<TwoFactory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoFactory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TwoFactory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
