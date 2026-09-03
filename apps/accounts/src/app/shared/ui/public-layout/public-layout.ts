import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import {
  HlmDialogContainerComponent,
  HlmToasterComponent,
} from '../../../../../projects/shared/src/public-api';
import { WhitelabelState } from '../../../states/whitelabel/whitelabel.state';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, HlmToasterComponent, HlmDialogContainerComponent],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayout {
  whitelabelState = inject(WhitelabelState);
  private router = inject(Router);
  private location = inject(Location);

  currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e: any) => e.urlAfterRedirects || e.url),
    ),
    { initialValue: '' },
  );

  goBack() {
    this.location.back();
  }
}
