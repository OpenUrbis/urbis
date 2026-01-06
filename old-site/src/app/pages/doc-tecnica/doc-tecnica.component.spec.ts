import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocTecnicaComponent } from './doc-tecnica.component';

describe('DocTecnicaComponent', () => {
  let component: DocTecnicaComponent;
  let fixture: ComponentFixture<DocTecnicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocTecnicaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocTecnicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
