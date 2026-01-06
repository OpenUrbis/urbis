import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoUrbisComponent } from './info-urbis.component';

describe('InfoUrbisComponent', () => {
  let component: InfoUrbisComponent;
  let fixture: ComponentFixture<InfoUrbisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoUrbisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoUrbisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
