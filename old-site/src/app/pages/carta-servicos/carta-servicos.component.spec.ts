import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartaServicosComponent } from './carta-servicos.component';

describe('CartaServicosComponent', () => {
  let component: CartaServicosComponent;
  let fixture: ComponentFixture<CartaServicosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartaServicosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartaServicosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
