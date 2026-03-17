import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,             // se for standalone, precisa disso
  imports: [RouterModule],       // importa o RouterModule, não só RouterOutlet
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']  // atenção no plural aqui!
})
export class AppComponent {
  title = 'urbis-site';
}