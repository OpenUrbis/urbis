import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { FooterComponent } from '../../components/footer/footer.component';  // ajuste o caminho conforme seu projeto
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-licenca-e-denuncias',
  standalone: true,
  imports: [
    CommonModule,       // necessário para diretivas padrão (*ngIf, *ngFor etc.)
    FooterComponent     // importa o componente de rodapé
  ],
  templateUrl: './licenca-e-denuncias.component.html',
  styleUrls: ['./licenca-e-denuncias.component.scss']
})
export class LicencaEDenunciasComponent {
  constructor(private location: Location) {}

  goBack(): void {
    window.location.href = 'https://urbis.sampa.br';
  }
}