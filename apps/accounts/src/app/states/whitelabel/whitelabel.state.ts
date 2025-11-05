import { computed, effect, inject, Injectable } from '@angular/core';
import { ApplicationTheme, IWhitelabelLocalStorage } from './whitelabel.types';
import {
  applyDynamicColorPalette,
  getWhitelabelDefaultValue,
  oppositeTheme,
} from './whitelabel.utils';
import { HttpClient } from '@angular/common/http';
import { OrganizationState } from '../organization/organization.state';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WhitelabelState {
  private http = inject(HttpClient);
  private organization = inject(OrganizationState);

  private whitelabelResource = rxResource({
    params: () => this.organization.value(),
    stream: ({ params }) => {
      if (!params.selectedOrganization?.id)
        return of(getWhitelabelDefaultValue());
      return this.http.get(
        `${environment.api}/organization/${params.selectedOrganization.id}/whitelabel/accounts`,
      );
    },
    defaultValue: getWhitelabelDefaultValue(),
  });

  loading = computed(
    () => this.organization.loading() || this.whitelabelResource.isLoading(),
  );
  value = computed(() => this.whitelabelResource.value() as any);
  errors = computed(() => this.whitelabelResource.error());

  constructor() {
    effect(() => {
      const primaryColor = this.value()?.global?.primaryColor;
      if (primaryColor) {
        const theme = this.value()?.application?.theme ?? 'light';
        applyDynamicColorPalette(primaryColor, theme);
      }

      localStorage.setItem(
        'whitelabel',
        JSON.stringify(this.value() as IWhitelabelLocalStorage),
      );
    });
  }

  toggleTheme() {
    this.whitelabelResource.value.set({
      ...this.value(),
      application: {
        ...this.value().application,
        theme:
          oppositeTheme[this.value().application.theme as ApplicationTheme],
      },
    });
  }

  setTheme(desiredTheme: ApplicationTheme) {
    this.whitelabelResource.value.set({
      ...this.value(),
      application: {
        ...this.value().application,
        theme: desiredTheme,
      },
    });
  }

  setPrimaryColor(desiredColor: string) {
    this.whitelabelResource.value.set({
      ...this.value(),
      global: {
        ...this.value().global,
        primaryColor: desiredColor,
      },
    });
  }
}
