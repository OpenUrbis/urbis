import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Shared } from './shared';

describe('Shared', () => {
  let component: Shared;
  let fixture: ComponentFixture<Shared>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shared]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Shared);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
