import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HintError } from './hint-error';

describe('HintError', () => {
  let component: HintError;
  let fixture: ComponentFixture<HintError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HintError]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HintError);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
