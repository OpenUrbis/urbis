import { Component, input } from '@angular/core';
import { Header } from '../header/header';
import { CommonModule, NgClass } from '@angular/common';

@Component({
  selector: 'app-page-structure',
  imports: [CommonModule, Header, NgClass],
  templateUrl: './page-structure.html',
  styleUrl: './page-structure.scss',
})
export class PageStructure {
  title = input<string>();
  subtitle = input<string>();
  backUrl = input<string>();

  containerClasses = input<string[]>(['']);
}
