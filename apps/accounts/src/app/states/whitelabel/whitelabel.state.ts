import { computed, effect, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { OrganizationState } from '../organization/organization.state';
import {
  ApplicationTheme,
  IUnifiedWhitelabelApi,
  IUpdateWhitelabelDto,
} from './whitelabel.types';
import {
  applyDynamicColorPalette,
  getWhitelabelDefaultValue,
  oppositeTheme,
} from './whitelabel.utils';
import { WhitelabelApi } from './whitelabel.service';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WhitelabelState {
  private api = inject(WhitelabelApi);
  private organization = inject(OrganizationState);

  private whitelabelResource = rxResource({
    defaultValue: getWhitelabelDefaultValue(),
    params: () => ({
      selectedOrganization: this.organization.selectedOrganization(),
    }),
    stream: ({ params }) => {
      if (!params.selectedOrganization?.id)
        return of({} as IUnifiedWhitelabelApi);
      return this.api.getUnifiedOrganizationWhitelabel(
        params.selectedOrganization?.id,
      );
    },
  });

  loading = computed(
    () => this.organization.loading() || this.whitelabelResource.isLoading(),
  );
  value = computed(() => this.whitelabelResource.value());
  errors = computed(() => ({
    organization: this.whitelabelResource.error(),
  }));

  constructor() {
    effect(() => {
      const value = this.value();

      if (value.primaryColor) {
        applyDynamicColorPalette(value.primaryColor, value.theme);
      }

      localStorage.setItem(
        'whitelabel',
        JSON.stringify(value as IUnifiedWhitelabelApi),
      );
    });
  }

  private requestUpdateApi(updates: IUpdateWhitelabelDto) {
    return this.api
      .updateOrganizationWhitelabel(
        this.organization.selectedOrganization()?.id,
        updates,
      )
      .subscribe((response) => {
        this.whitelabelResource.value.set(response);
      });
  }

  reload() {
    this.whitelabelResource.reload();
  }

  toggleTheme() {
    const theme = oppositeTheme[this.value().theme];
    return this.requestUpdateApi({ theme });
  }

  setTheme(theme: ApplicationTheme) {
    return this.requestUpdateApi({ theme });
  }

  setPrimaryColor(primaryColor: string) {
    return this.requestUpdateApi({ primaryColor });
  }
}
