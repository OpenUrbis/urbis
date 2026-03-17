import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mosaico',
  imports: [
    CommonModule,
    MatButtonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatExpansionModule,
    FormsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './mosaico.component.html',
  styleUrl: './mosaico.component.scss'
})
export class MosaicoComponent {
  searchTerm = '';

  onSearchSubmit(event: Event) {
    event.preventDefault();
    const term = encodeURIComponent(this.searchTerm.trim());
    if (term) {
      window.open(`https://mapa.urbis.sampa.br/?search=${term}`, '_blank');
    } else {
      window.open('https://mapa.urbis.sampa.br', '_blank');
    }
  }
}
