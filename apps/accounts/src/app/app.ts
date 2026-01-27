import { Component, inject, computed, Signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { WhitelabelState } from './states/whitelabel/whitelabel.state';
import { UrbisHeader } from './components/urbis-header/urbis-header';
import { HlmToasterComponent, HlmDialogContainerComponent } from '../../projects/shared/src/public-api';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UrbisHeader, HlmToasterComponent, HlmDialogContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'accounts';
  whitelabelState = inject(WhitelabelState);
  private router = inject(Router);

  menuItems = [
    { label: 'Mosaico', href: 'https://urbis.prefeitura.sp.gov.br'},
    { label: 'Mapa', href: 'https://mapa.urbis.prefeitura.sp.gov.br' },
    { label: 'Dados Abertos', href: 'https://dadosabertos.urbis.prefeitura.sp.gov.br' },
    { label: 'Legis', href: 'https://docs.urbis.sampa.br/docs/legis' },
    { label: 'Viabiliza', href: 'https://viabiliza.urbis.sampa.br/docs/legis' },
    { label: 'Doc. técnica', href: 'https://docs.urbis.sampa.br/' },
  ];

  currentUrl = toSignal(
    this.router.events.pipe(
        filter(e => e instanceof NavigationEnd),
        map((e: any) => e.urlAfterRedirects || e.url)
    ),
    { initialValue: '' }
 );

 showMenu: Signal<boolean> = computed(() => {
    const url = this.currentUrl();
    if (!url) return true;
    const hiddenRoutes = ['/sign-in', '/sign-up', '/forgot-password', '/confirm-account', '/two-factor'];
    return !hiddenRoutes.some(r => url.startsWith(r));
 });
}
