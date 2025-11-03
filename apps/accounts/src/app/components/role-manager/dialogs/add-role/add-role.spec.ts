import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRole } from './add-role';

describe('AddRole', () => {
  let component: AddRole;
  let fixture: ComponentFixture<AddRole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRole]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRole);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
