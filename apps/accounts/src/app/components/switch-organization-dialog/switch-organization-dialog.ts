import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { OrganizationSwitcher } from '../organization-switcher/organization-switcher';
import { DialogRef } from '../../../../projects/shared/src/lib/ui/dialog/hlm-dialog.service';

@Component({
  selector: 'app-switch-organization-dialog',
  standalone: true,
  imports: [OrganizationSwitcher, TranslateModule],
  templateUrl: './switch-organization-dialog.html',
})
export class SwitchOrganizationDialog {
  readonly dialogRef = inject(DialogRef<SwitchOrganizationDialog>);

  change() {
    this.dialogRef.close();
    window.location.reload();
  }
}
