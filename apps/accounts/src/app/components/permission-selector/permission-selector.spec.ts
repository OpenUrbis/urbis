import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionSelector } from './permission-selector';

describe('PermissionSelector', () => {
  let component: PermissionSelector;
  let fixture: ComponentFixture<PermissionSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(PermissionSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
