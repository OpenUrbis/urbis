import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationSelector } from './organization-selector';

describe('OrganizationSelector', () => {
  let component: OrganizationSelector;
  let fixture: ComponentFixture<OrganizationSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
