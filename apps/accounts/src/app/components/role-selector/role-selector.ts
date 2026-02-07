import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { CommonModule } from "@angular/common";
import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { debounceTime, map, startWith, switchMap, tap } from "rxjs";
import { IRoleResponse } from "../../components/role-manager/dto/role.dto";
import { RoleManagerApi } from "../../components/role-manager/services/role-manager-api";
import { TranslateModule } from "@ngx-translate/core";
import {
  HlmInputDirective,
  HlmIconComponent,
} from "../../../../projects/shared/src/public-api";
import { provideIcons } from "@ng-icons/core";
import { lucideSearch, lucideX } from "@ng-icons/lucide";

@Component({
  selector: "app-role-selector",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmInputDirective,
    HlmIconComponent,
  ],
  providers: [provideIcons({ lucideSearch, lucideX })],
  templateUrl: "./role-selector.html",
})
export class RoleSelector implements OnInit {
  control = input.required<FormControl>();
  multi = input<boolean>(false);

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  search = new FormControl();
  searchLoading = signal<boolean>(false);
  selectedRoles = signal<any[]>([]);

  roleManagerApi = inject(RoleManagerApi);

  selectedRoleIds = computed(() => this.selectedRoles().map(({ id }) => id));

  roles = toSignal(
    this.search.valueChanges.pipe(
      startWith(""),
      debounceTime(300),
      tap(() => this.searchLoading.set(true)),
      switchMap((search) =>
        this.roleManagerApi
          .listRoles({
            search: typeof search === "string" ? search : "",
            exclude: this.multi() ? this.selectedRoleIds() : [],
          })
          .pipe(map((value) => (value as any)?.data ?? [])),
      ),
      tap(() => this.searchLoading.set(false)),
    ),
  );

  constructor() {
    effect(() => {
      const value = this.selectedRoles();
      this.control().setValue(this.multi() ? value : value?.[0], {
        emitEvent: false,
      });
    });
  }

  ngOnInit(): void {
    this.control()
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((value) => {
        if (!value) {
          if (this.selectedRoles().length > 0) this.selectedRoles.set([]);
          return;
        }
        if (this.multi() && !value?.length) {
          if (this.selectedRoles().length > 0) this.selectedRoles.set([]);
          return;
        }

        const newValue = Array.isArray(value) ? value : [value];
        this.selectedRoles.set(newValue);

        if (!this.multi()) this.search.setValue("", { emitEvent: false });
      });
  }

  public remove(index: number): void {
    this.selectedRoles.update((roles) => {
      roles.splice(index, 1);
      return [...roles];
    });
  }

  public select(role: any): void {
    if (this.selectedRoleIds().includes(role.id)) return;

    this.selectedRoles.update((roles) =>
      this.multi() ? [...roles, role] : [role],
    );
    this.search.setValue("");
  }
}
