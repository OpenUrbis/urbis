import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime, map, startWith, switchMap, tap } from 'rxjs';
import { IOrganization } from '../../pages/organizations/dto/organization.dto';
import { OrganizationsApi } from '../../pages/organizations/services/organizations-api';
import { TranslateModule } from '@ngx-translate/core';
import { HlmInputDirective, HlmIconComponent } from '../../../../projects/shared/src/public-api';
import { provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideX } from '@ng-icons/lucide';

@Component({
  selector: 'app-organization-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmInputDirective,
    HlmIconComponent
  ],
  providers: [provideIcons({ lucideSearch, lucideX })],
  templateUrl: './organization-selector.html',
})
export class OrganizationSelector implements OnInit {
  control = input.required<FormControl | AbstractControl>();
  multi = input<boolean>(false);

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  search = new FormControl();
  searchLoading = signal<boolean>(false);
  selectedOrganizations = signal<IOrganization[]>([]);

  organizationApi = inject(OrganizationsApi);

  selectedOrganizationIds = computed(() =>
    this.selectedOrganizations().map(({ id }) => id),
  );

  organizations = toSignal(
    this.search.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      tap(() => this.searchLoading.set(true)),
      switchMap((search) =>
        this.organizationApi
          .list({
            search: typeof search === 'string' ? search : '',
            exclude: this.multi() ? this.selectedOrganizationIds() : [],
          })
          .pipe(map((value) => (value as any)?.data ?? [])),
      ),
      tap(() => this.searchLoading.set(false)),
    ),
  );

  constructor() {
    effect(() => {
      const value = this.selectedOrganizations();
      this.control().setValue(this.multi() ? value : value?.[0]);
    });
  }

  ngOnInit(): void {
    const subs = this.control()?.valueChanges.subscribe((value) => {
      if (!value) {
          if (this.multi() && this.selectedOrganizations().length > 0) {
              this.selectedOrganizations.set([]);
          } else if (!this.multi() && this.selectedOrganizations().length > 0) {
              this.selectedOrganizations.set([]);
          }
          return;
      }
      
      if (this.multi() && !value?.length) {
          this.selectedOrganizations.set([]);
          return;
      }

      this.selectedOrganizations.update(() =>
        Array.isArray(value) ? value : [value],
      );
      // Ensure search doesn't clear immediately if we want to show selected? No, separate state.
      
      subs.unsubscribe();
    });
  }

  remove(index: number): void {
    this.selectedOrganizations.update((orgs) => {
      orgs.splice(index, 1);
      return [...orgs];
    });
  }

  select(org: IOrganization): void {
    if (this.selectedOrganizationIds().includes(org.id)) return;

    this.selectedOrganizations.update((orgs) =>
      this.multi() ? [...orgs, org] : [org],
    );
    this.search.setValue('');
  }
}
