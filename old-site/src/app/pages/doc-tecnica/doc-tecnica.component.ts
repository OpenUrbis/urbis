import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-doc-tecnica',
  imports: [FooterComponent],
  templateUrl: './doc-tecnica.component.html',
  styleUrls: ['./doc-tecnica.component.scss'],
})
export class DocTecnicaComponent {
  constructor(private location: Location) {}

  goBack(): void {
    window.location.href = 'https://urbis.sampa.br';
  }
}