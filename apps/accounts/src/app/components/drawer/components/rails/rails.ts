import { NgClass } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatNavList } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';
import { WhitelabelState } from '../../../../states/whitelabel/whitelabel.state';
import { RouterModule } from '@angular/router';
import { applicationRedirectDirectionary } from '../../../../states/whitelabel/whitelabel.utils';

@Component({
  selector: 'app-rails',
  imports: [
    MatNavList,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    RouterModule,
    NgClass,
  ],
  templateUrl: './rails.html',
  styleUrl: './rails.scss',
})
export class Rails {
  private readonly whitelabelState = inject(WhitelabelState);
  items = computed(() => this.whitelabelState.value().layout.rails.items);
  redirect(href: string | undefined) {
    if (!href) return '#';
    if (href in applicationRedirectDirectionary) {
      return applicationRedirectDirectionary[href];
    }
    return href;
  }
}
