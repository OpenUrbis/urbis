import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { FooterComponent } from '../../components/footer/footer.component'; // caminho relativo correto

@Component({
  selector: 'app-carta-servicos',
  imports: [FooterComponent],
  templateUrl: './carta-servicos.component.html',
  styleUrl: './carta-servicos.component.scss'
})
export class CartaServicosComponent {

  constructor(private location: Location) {}

  goBack(): void {
    window.location.href = 'https://urbis.sampa.br';
  }

  scrollTo(id: string): void {
  const el = document.getElementById(id);
  if (el) {
    const headerOffset = 100; // ajuste aqui conforme a altura do seu header fixo
    const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}
}
