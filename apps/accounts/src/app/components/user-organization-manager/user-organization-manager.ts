import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, switchMap, tap } from 'rxjs';
import { LoadingContent, HlmButtonDirective, HlmIconComponent, HlmDialogService } from '../../../../projects/shared/src/public-api';
import { IResponseOrganizationWithRole } from '../../pages/organizations/dto/organization.dto';
import { OrganizationsApi } from '../../pages/organizations/services/organizations-api';
import { HandleUserOrganization } from './components/handle-user-organization/handle-user-organization';
import { TranslateModule } from '@ngx-translate/core';
import { PageStructure } from '../page-structure/page-structure';
import { TranslateService } from '@ngx-translate/core';
import { provideIcons } from '@ng-icons/core';
import { lucidePlus, lucidePencil } from '@ng-icons/lucide';

@Component({
  selector: 'app-user-organization-manager',
  imports: [
    CommonModule,
    LoadingContent,
    TranslateModule,
    PageStructure,
    HlmButtonDirective,
    HlmIconComponent
  ],
  providers: [provideIcons({ lucidePlus, lucidePencil })],
  templateUrl: './user-organization-manager.html',
})
export class UserOrganizationManager {
  userId = input.required<string>();
  user$ = new Subject<string>();
  loading = signal<boolean>(false);

  organizationApi = inject(OrganizationsApi);
  dialogService = inject(HlmDialogService);
  translate = inject(TranslateService);

  organizations = toSignal(
    this.user$.pipe(
      tap(() => this.loading.set(true)),
      switchMap((userId: string) => this.organizationApi.listByUser(userId)),
      tap(() => this.loading.set(false)),
    ),
  );

  constructor() {
    effect(() => this.user$.next(this.userId()));
  }

  buildRoles(item: IResponseOrganizationWithRole) {
    const { userRoleAssignments } = item;
    const labelKey =
      userRoleAssignments.length > 1
        ? 'components.userOrganizationManager.page.labels.rolesMultiple'
        : 'components.userOrganizationManager.page.labels.rolesSingle';
    let txt = `${this.translate.instant(labelKey)} `;

    userRoleAssignments.forEach(({ role }, i) => {
      txt += role.name;
      if (i < userRoleAssignments.length - 1) txt += ', ';
    });

    return txt;
  }

  handleAssign(item?: IResponseOrganizationWithRole) {
    const dialogRef = this.dialogService.open(HandleUserOrganization, {
      data: { organization: item, userId: this.userId() },
      width: '500px',
    });

    dialogRef.afterClosed().then(() => this.user$.next(this.userId()));
  }
}
