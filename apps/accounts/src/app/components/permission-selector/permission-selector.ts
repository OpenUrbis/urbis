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
import { debounceTime, startWith, switchMap, tap } from 'rxjs';
import { IPermissionResponse } from '../role-manager/dto/permission.dto';
import { RoleManagerApi } from '../role-manager/services/role-manager-api';

@Component({
  selector: 'app-permission-selector',
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
  ],
  templateUrl: './permission-selector.html',
  styleUrl: './permission-selector.scss',
})
export class PermissionSelector implements OnInit {
  control = input.required<FormControl | AbstractControl>();
  multi = input<boolean>(false);

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  search = new FormControl();
  searchLoading = signal<boolean>(false);
  selectedPermissions = signal<IPermissionResponse[]>([]);

  roleManagerApi = inject(RoleManagerApi);

  selectedPermissionIds = computed(() =>
    this.selectedPermissions().map(({ id }) => id),
  );

  permissions = toSignal(
    this.search.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      tap(() => this.searchLoading.set(true)),
      switchMap((search) =>
        this.roleManagerApi.listPermissions({
          search: typeof search === 'string' ? search : '',
          exclude: this.multi() ? this.selectedPermissionIds() : [],
        }),
      ),
      tap(() => this.searchLoading.set(false)),
    ),
  );

  constructor() {
    effect(() => {
      const value = this.selectedPermissions();
      this.control().setValue(this.multi() ? value : value?.[0]);
    });
  }

  ngOnInit(): void {
    const subs = this.control()?.valueChanges.subscribe((value) => {
      if (!value) return;
      if (this.multi() && !value?.length) return;

      this.selectedPermissions.update(() => Array.isArray(value) ? value : [value],);
      if (!this.multi()) this.search.setValue(value, { emitEvent: false });

      subs.unsubscribe();
    });
  }

  remove(index: number): void {
    this.selectedPermissions.update((orgs) => {
      orgs.splice(index, 1);
      return [...orgs];
    });
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const newRegister = event.option.value as IPermissionResponse;
    if (this.selectedPermissionIds().includes(newRegister.id)) return;

    this.selectedPermissions.update((orgs) =>
      this.multi() ? [...orgs, newRegister] : [newRegister],
    );
    if (this.multi()) {
      this.search.setValue('');
      event.option.deselect();
    }
  }

  displayFn(org: IPermissionResponse): string {
    return org?.name ?? '';
  }
}
