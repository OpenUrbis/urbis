import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserOrganizationManager } from './user-organization-manager';

describe('UserOrganizationManager', () => {
  let component: UserOrganizationManager;
  let fixture: ComponentFixture<UserOrganizationManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserOrganizationManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserOrganizationManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
