import { Component, computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import {
  HlmDialogContainerComponent,
  HlmToasterComponent,
} from '../../../../../projects/shared/src/public-api';
import { UrbisHeader } from '../../../components/urbis-header/urbis-header';
import { WhitelabelState } from '../../../states/whitelabel/whitelabel.state';

@Component({
  selector: 'app-private-layout',
  imports: [
    RouterOutlet,
    UrbisHeader,
    HlmToasterComponent,
    HlmDialogContainerComponent,
  ],
  templateUrl: './private-layout.html',
  styleUrl: './private-layout.scss',
})
export class PrivateLayout {
  whitelabelState = inject(WhitelabelState);
  private router = inject(Router);

  menuItems = [
    { label: 'Mosaico', href: 'https://urbis.prefeitura.sp.gov.br' },
    { label: 'Mapa', href: 'https://mapa.urbis.prefeitura.sp.gov.br' },
    {
      label: 'Dados Abertos',
      href: 'https://dadosabertos.urbis.prefeitura.sp.gov.br',
    },
    {
      label: 'Legis',
      href: 'https://docs.urbis.prefeitura.sp.gov.br/docs/legis',
    },
    {
      label: 'Viabiliza',
      href: 'https://viabiliza.urbis.prefeitura.sp.gov.br/docs/legis',
    },
    { label: 'Doc. técnica', href: 'https://docs.urbis.prefeitura.sp.gov.br/' },
  ];

  currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e: any) => e.urlAfterRedirects || e.url),
    ),
    { initialValue: '' },
  );

  showMenu: Signal<boolean> = computed(() => {
    const url = this.currentUrl();
    if (!url) return true;
    const hiddenRoutes = [
      '/sign-in',
      '/sign-up',
      '/forgot-password',
      '/confirm-account',
      '/two-factor',
    ];
    return !hiddenRoutes.some((r) => url.startsWith(r));
  });
}
