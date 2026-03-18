import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogData } from './dto/confirm-dialog.dto';

@Component({
  selector: 'lib-confirm-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    @if (data.description) {
      <mat-dialog-content>{{ data.description }}</mat-dialog-content>
    }
    <mat-dialog-actions align="end">
      <button
        mat-button
        [color]="data.cancelColor || 'basic'"
        (click)="onCancel()"
      >
        {{ data.cancelText || 'Não' }}
      </button>
      <button
        mat-button
        [color]="data.confirmColor || 'primary'"
        (click)="onConfirm()"
      >
        {{ data.confirmText || 'Sim' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialog {
  readonly dialogRef = inject(MatDialogRef<ConfirmDialog>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  /**
   * Handles the confirm action by closing the dialog with true.
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Handles the cancel action by closing the dialog with false.
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
