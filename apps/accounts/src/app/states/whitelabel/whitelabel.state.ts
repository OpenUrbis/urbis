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
  value = computed(() => {
    const value = this.whitelabelResource.value() as any;
    const obj = {
      theme: value.application?.theme ?? 'light',
      primaryColor: value.global?.primaryColor,
    } as IWhitelabelLocalStorage;
    obj.logo = value.global?.logos?.[obj.theme];
    obj.icon = value.global?.icons?.[obj.theme];
    return obj;
  });
  errors = computed(() => this.whitelabelResource.error());

  constructor() {
    effect(() => {
      const primaryColor = this.value().primaryColor;
      if (primaryColor) {
        applyDynamicColorPalette(primaryColor, this.value().theme);
      }

      localStorage.setItem(
        'whitelabel',
        JSON.stringify(this.value() as IWhitelabelLocalStorage),
      );
    });
  }

  toggleTheme() {
    const whitelabel = this.whitelabelResource.value() as any;
    this.whitelabelResource.value.set({
      ...whitelabel,
      application: {
        ...whitelabel.application,
        theme: oppositeTheme[this.value().theme],
      },
    });
  }

  setTheme(desiredTheme: ApplicationTheme) {
    const whitelabel = this.whitelabelResource.value() as any;
    this.whitelabelResource.value.set({
      ...whitelabel,
      application: {
        ...whitelabel.application,
        theme: desiredTheme,
      },
    });
  }

  setPrimaryColor(desiredColor: string) {
    const whitelabel = this.whitelabelResource.value() as any;
    this.whitelabelResource.value.set({
      ...whitelabel,
      global: {
        ...whitelabel.global,
        primaryColor: desiredColor,
      },
    });
  }
}
