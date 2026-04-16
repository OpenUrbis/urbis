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
import { IRoleResponse } from '../role-manager/dto/role.dto';
import { RoleManagerApi } from '../role-manager/services/role-manager-api';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-role-selector',
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
  templateUrl: './role-selector.html',
  styleUrl: './role-selector.scss',
})
export class RoleSelector implements OnInit {
  control = input.required<FormControl | AbstractControl>();
  multi = input<boolean>(false);

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  search = new FormControl();
  searchLoading = signal<boolean>(false);
  selectedRoles = signal<IRoleResponse[]>([]);

  roleManagerApi = inject(RoleManagerApi);

  selectedRoleIds = computed(() => this.selectedRoles().map(({ id }) => id));

  roles = toSignal(
    this.search.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      tap(() => this.searchLoading.set(true)),
      switchMap((search) =>
        this.roleManagerApi
          .listRoles({
            search: typeof search === 'string' ? search : '',
            exclude: this.multi() ? this.selectedRoleIds() : [],
          })
          .pipe(map((res) => (Array.isArray(res) ? res : res.data))),
      ),
      tap(() => this.searchLoading.set(false)),
    ),
  );

  constructor() {
    effect(() => {
      const value = this.selectedRoles();
      this.control().setValue(this.multi() ? value : value?.[0]);
    });
  }

  ngOnInit(): void {
    const subs = this.control()?.valueChanges.subscribe((value) => {
      if (!value) return;
      if (this.multi() && !value?.length) return;

      this.selectedRoles.update(() => (Array.isArray(value) ? value : [value]));
      if (!this.multi()) this.search.setValue(value, { emitEvent: false });

      subs.unsubscribe();
    });
  }

  remove(index: number): void {
    this.selectedRoles.update((roles) => {
      roles.splice(index, 1);
      return [...roles];
    });
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const newRegister = event.option.value as IRoleResponse;
    if (this.selectedRoleIds().includes(newRegister.id)) return;

    this.selectedRoles.update((roles) =>
      this.multi() ? [...roles, newRegister] : [newRegister],
    );
    if (this.multi()) {
      this.search.setValue('');
      event.option.deselect();
    }
  }

  displayFn(role: IRoleResponse): string {
    return role?.name ?? '';
  }
}
