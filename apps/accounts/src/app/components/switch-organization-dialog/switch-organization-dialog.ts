import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { OrganizationSwitcher } from '../organization-switcher/organization-switcher';
import { DialogRef } from '../../../../projects/shared/src/lib/ui/dialog/hlm-dialog.service';
import { IOrganization } from '../../pages/organizations/dto/organization.dto';
import { OrganizationState } from '../../states/organization/organization.state';

@Component({
  selector: 'app-switch-organization-dialog',
  standalone: true,
  imports: [OrganizationSwitcher, TranslateModule],
  templateUrl: './switch-organization-dialog.html',
})
export class SwitchOrganizationDialog {
  readonly dialogRef = inject(DialogRef<SwitchOrganizationDialog>);
  private organizationState = inject(OrganizationState);

  selectedOrg: IOrganization | null = null;

  onSelect(org: IOrganization) {
    this.selectedOrg = org;
  }

  cancel() {
    this.dialogRef.close();
  }

  confirm() {
    if (this.selectedOrg) {
      this.organizationState.selectOrganization(this.selectedOrg);
      this.dialogRef.close();
      window.location.reload();
    }
  }
}
