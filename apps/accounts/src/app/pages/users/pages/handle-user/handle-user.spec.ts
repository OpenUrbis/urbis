import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleUser } from './handle-user';

describe('HandleUser', () => {
  let component: HandleUser;
  let fixture: ComponentFixture<HandleUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandleUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandleUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
