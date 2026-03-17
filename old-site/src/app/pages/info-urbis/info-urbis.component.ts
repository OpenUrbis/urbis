import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-info-urbis',
  standalone: true,
  imports: [FooterComponent],
  templateUrl: './info-urbis.component.html',
  styleUrls: ['./info-urbis.component.scss']
})
export class InfoUrbisComponent {
  constructor(private location: Location) {}

  goBack(): void {
    window.location.href = 'https://urbis.sampa.br';
  }
}