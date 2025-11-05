import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleSelector } from './role-selector';

describe('RoleSelector', () => {
  let component: RoleSelector;
  let fixture: ComponentFixture<RoleSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
