import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicencaEDenunciasComponent } from './licenca-e-denuncias.component';

describe('LicencaEDenunciasComponent', () => {
  let component: LicencaEDenunciasComponent;
  let fixture: ComponentFixture<LicencaEDenunciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LicencaEDenunciasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LicencaEDenunciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
