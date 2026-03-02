import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileApi } from './profile-api';

describe('ProfileApi', () => {
  let component: ProfileApi;
  let fixture: ComponentFixture<ProfileApi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileApi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileApi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
