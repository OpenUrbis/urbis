import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { OrganizationSwitcher } from '../organization-switcher/organization-switcher';

@Component({
  selector: 'app-switch-organization-dialog',
  imports: [OrganizationSwitcher, MatDialogModule, TranslateModule],
  templateUrl: './switch-organization-dialog.html',
  styleUrl: './switch-organization-dialog.scss',
})
export class SwitchOrganizationDialog {
  readonly dialogRef = inject(MatDialogRef<SwitchOrganizationDialog>);

  change() {
    this.dialogRef.close();
    window.location.reload();
  }
}
