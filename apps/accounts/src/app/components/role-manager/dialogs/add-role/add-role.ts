import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, map, startWith, switchMap, tap } from 'rxjs';
import { PermissionScopePipe } from '../../../../pipes/permission-scope-pipe';
import { IRoleResponse } from '../../dto/role.dto';
import { RoleManagerApi } from '../../services/role-manager-api';
import { LoadingContent, HlmButtonDirective, HlmIconComponent, HlmToasterService, DialogRef, DIALOG_DATA } from '../../../../../../projects/shared/src/public-api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideCheck, lucideChevronDown } from '@ng-icons/lucide';

@Component({
  selector: 'app-add-role',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HlmButtonDirective,
    HlmIconComponent,
    PermissionScopePipe,
    LoadingContent,
    TranslateModule,
  ],
  providers: [provideIcons({ lucidePlus, lucideCheck, lucideChevronDown })],
  templateUrl: './add-role.html',
})
export class AddRole {
  searchRole = new FormControl();

  loading = signal<boolean>(false);

  toaster = inject(HlmToasterService);
  roleManagerApi = inject(RoleManagerApi);
  translate = inject(TranslateService);
  readonly dialogRef = inject(DialogRef<AddRole>);
  readonly data = inject<{ userId: string; roles: string[] }>(DIALOG_DATA);

  result$ = this.searchRole.valueChanges.pipe(
    startWith(''),
    debounceTime(300),
    tap(() => this.loading.set(true)),
    switchMap((search) =>
      this.roleManagerApi
        .listRoles({ search: search || '' })
        .pipe(map((value) => (value as any)?.data ?? [])),
    ),
    tap(() => this.loading.set(false)),
  );

  addRole(event: Event, role: IRoleResponse) {
    event.stopImmediatePropagation();
    this.roleManagerApi
      .assign({ userId: this.data.userId, roleId: role.id })
      .subscribe({
        next: (result) => {
          this.data.roles.push(result.roleId);
        },
        error: (err) => {
          this.toaster.error(
            this.translate.instant(
              'components.roleManager.addRole.errors.assign',
            ),
          );
          console.error(err);
        },
      });
  }
}
