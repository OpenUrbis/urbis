import { computed, effect, inject, Injectable, signal } from '@angular/core';
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

  private _apiData = signal<IUnifiedWhitelabelApi>(getWhitelabelDefaultValue());
  private _localTheme = signal<ApplicationTheme>(
    getWhitelabelDefaultValue().theme,
  );

  loading = computed(
    () => this.organization.loading() || this.whitelabelResource.isLoading(),
  );

  value = computed(() => ({
    ...this._apiData(),
    theme: this._localTheme(),
  }));

  errors = computed(() => ({
    organization: this.whitelabelResource.error(),
  }));

  constructor() {
    // Sync Resource -> API Data
    effect(
      () => {
        const resValue = this.whitelabelResource.value();
        if (resValue) {
          this._apiData.set(resValue);
        }
      },
      { allowSignalWrites: true },
    );

    // Apply Theme (based on _localTheme) & Persist to LocalStorage
    effect((onCleanup) => {
      const theme = this._localTheme();
      const apiData = this._apiData();

      // Combine for persistence and application
      const fullState = { ...apiData, theme };

      const apply = () => {
        if (fullState.primaryColor) {
          applyDynamicColorPalette(fullState.primaryColor, fullState.theme);
        }

        const html = document.documentElement;
        const body = document.body;
        const isDark =
          fullState.theme === 'dark' ||
          (fullState.theme === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

        const classesToRemove = ['light-theme', 'dark-theme', 'dark'];
        html.classList.remove(...classesToRemove);
        body.classList.remove(...classesToRemove);

        if (isDark) {
          html.classList.add('dark');
          body.classList.add('dark');
        }
        html.style.colorScheme = isDark ? 'dark' : 'light';
      };

      apply();

      if (fullState.theme === 'system') {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => apply();
        media.addEventListener('change', listener);
        onCleanup(() => media.removeEventListener('change', listener));
      }

      localStorage.setItem(
        'whitelabel',
        JSON.stringify(fullState as IUnifiedWhitelabelApi),
      );
    });
  }

  private requestUpdateApi(updates: IUpdateWhitelabelDto) {
    // Update local state if theme is involved
    if (updates.theme) {
      this._localTheme.set(updates.theme);
    }
    // Update api state for other fields
    if (updates.primaryColor) {
      this._apiData.update((curr) => ({
        ...curr,
        primaryColor: updates.primaryColor!,
      }));
    }

    // Prepare API payload - handle system theme fallback for DB constraint
    const apiUpdates = { ...updates };
    if (apiUpdates.theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      apiUpdates.theme = isDark ? 'dark' : 'light';
    }

    return this.api
      .updateOrganizationWhitelabel(
        this.organization.selectedOrganization()?.id,
        apiUpdates,
      )
      .subscribe({
        next: (response) => {
          // Update API data signal, but theme signal is separate and won't be overwritten by response theme
          this._apiData.set(response);
          this.whitelabelResource.value.set(response);
        },
        error: (err) => {
          console.error('Failed to update whitelabel', err);
          // Optional: Revert local theme if API fails?
          // For now, keep local preference as user intention is clear.
        },
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
