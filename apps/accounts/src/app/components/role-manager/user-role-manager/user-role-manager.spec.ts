import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRoleManager } from './user-role-manager';

describe('UserRoleManager', () => {
  let component: UserRoleManager;
  let fixture: ComponentFixture<UserRoleManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRoleManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRoleManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
