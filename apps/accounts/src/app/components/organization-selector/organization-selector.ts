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
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, map, startWith, switchMap, tap } from 'rxjs';
import { IOrganization } from '../../pages/organizations/dto/organization.dto';
import { OrganizationsApi } from '../../pages/organizations/services/organizations-api';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-organization-selector',
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
    TranslateModule,
  ],
  templateUrl: './organization-selector.html',
  styleUrl: './organization-selector.scss',
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
      if (!value) return;
      if (this.multi() && !value?.length) return;

      this.selectedOrganizations.update(() =>
        Array.isArray(value) ? value : [value],
      );
      if (!this.multi()) this.search.setValue(value, { emitEvent: false });

      subs.unsubscribe();
    });
  }

  remove(index: number): void {
    this.selectedOrganizations.update((orgs) => {
      orgs.splice(index, 1);
      return [...orgs];
    });
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const newRegister = event.option.value as IOrganization;
    if (this.selectedOrganizationIds().includes(newRegister.id)) return;

    this.selectedOrganizations.update((orgs) =>
      this.multi() ? [...orgs, newRegister] : [newRegister],
    );
    if (this.multi()) {
      this.search.setValue('');
      event.option.deselect();
    }
  }

  displayFn(org: IOrganization): string {
    return org?.name ?? '';
  }
}
