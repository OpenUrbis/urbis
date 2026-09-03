import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '../../ui/dialog/hlm-dialog.service';
import { HlmButtonDirective } from '../../ui/button/hlm-button.directive';
import { ConfirmDialogData } from './dto/confirm-dialog.dto';

@Component({
  selector: 'lib-confirm-dialog',
  standalone: true,
  imports: [CommonModule, HlmButtonDirective],
  template: `
    <h2 class="text-lg font-semibold mb-2">{{ data.title }}</h2>
    @if (data.description) {
      <div class="text-muted-foreground mb-6">{{ data.description }}</div>
    }
    <div class="flex justify-end gap-2">
      <button
        hlmBtn
        variant="outline"
        (click)="onCancel()"
        class="border-input hover:bg-accent hover:text-accent-foreground"
      >
        {{ data.cancelText || 'Não' }}
      </button>
      <button
        hlmBtn
        [variant]="data.confirmColor === 'warn' ? 'destructive' : 'default'"
        (click)="onConfirm()"
      >
        {{ data.confirmText || 'Sim' }}
      </button>
    </div>
  `,
})
export class ConfirmDialog {
  readonly dialogRef = inject(DialogRef<ConfirmDialog>);
  readonly data = inject<ConfirmDialogData>(DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
