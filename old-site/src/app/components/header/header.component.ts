import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { languages } from '../../services/i18n.utils';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatCardModule,
    MatButtonToggleModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatMenuModule,
    RouterModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  isMenuOpen = signal(false);
  showLoginPanel = signal(false);

  currentLanguage = computed(() => {
    return (
      this.i18nService.languages().find(
        (language) => language.isoCode === this.i18nService.currentLanguage
      )?.name ?? languages[0].name
    );
  });

  constructor(
    private router: Router,
    public i18nService: I18nService,
    private elRef: ElementRef,
    private renderer: Renderer2
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeMenu();
      }
    });

    // ✔️ ESTA LINHA TEM QUE FICAR DENTRO DO CONSTRUCTOR!
    this.renderer.listen('document', 'click', (event: MouseEvent) => {
      this.handleOutsideClick(event);
    });
  }

  toggleMenu() {
    this.isMenuOpen.update((value) => !value);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  handleI18nBtnClick(isoCode: string) {
    this.i18nService.updateRoute(isoCode);
  }

  toggleLoginPanel() {
    this.showLoginPanel.update((value) => !value);
  }

  private handleOutsideClick(event: MouseEvent) {
    if (!this.showLoginPanel()) return;

    const clickedInside = this.elRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.showLoginPanel.set(false);
    }
  }
}