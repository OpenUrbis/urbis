import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { HeroComponent } from './hero/hero.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { MosaicoComponent } from './mosaico/mosaico.component';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterModule,     // importante para diretivas de roteamento no template
    HeaderComponent,
    FooterComponent,
    HeroComponent,
    MosaicoComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor(private router: Router) {}

  navegarParaAjuda() {
    this.router.navigate(['/ajuda']);
  }
}