import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesManager } from './roles-manager';

describe('RolesManager', () => {
  let component: RolesManager;
  let fixture: ComponentFixture<RolesManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolesManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
