import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleOrganization } from './handle-organization';

describe('HandleOrganization', () => {
  let component: HandleOrganization;
  let fixture: ComponentFixture<HandleOrganization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandleOrganization]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandleOrganization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
