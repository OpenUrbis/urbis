import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleRole } from './handle-role';

describe('HandleRole', () => {
  let component: HandleRole;
  let fixture: ComponentFixture<HandleRole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandleRole]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandleRole);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
