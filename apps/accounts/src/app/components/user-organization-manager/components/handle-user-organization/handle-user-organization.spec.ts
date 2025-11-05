import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleUserOrganization } from './handle-user-organization';

describe('HandleUserOrganization', () => {
  let component: HandleUserOrganization;
  let fixture: ComponentFixture<HandleUserOrganization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandleUserOrganization]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandleUserOrganization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
