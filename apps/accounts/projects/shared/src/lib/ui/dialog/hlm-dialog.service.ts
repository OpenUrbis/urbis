import {
  Injectable,
  Component,
  Type,
  inject,
  signal,
  computed,
  Injector,
  InjectionToken,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DialogConfig {
  data?: any;
  width?: string;
  maxWidth?: string;
}

export abstract class DialogRef<T = any> {
  abstract close(result?: T): void;
  abstract afterClosed(): Promise<T | undefined>;
}

export const DIALOG_DATA = new InjectionToken<any>('DIALOG_DATA');

@Injectable({
  providedIn: 'root',
})
export class HlmDialogService {
  private readonly _dialogs = signal<any[]>([]);
  readonly dialogs = computed(() => this._dialogs());
  private injector = inject(Injector);

  open<T, R = any>(component: Type<T>, config?: DialogConfig): DialogRef<R> {
    const dialogId = Math.random().toString(36).substring(2, 9);
    let resolveClose: (value: R | undefined) => void;

    const closePromise = new Promise<R | undefined>((resolve) => {
      resolveClose = resolve;
    });

    const dialogRef: DialogRef<R> = {
      close: (result?: R) => {
        this._dialogs.update((d) =>
          d.filter((dialog) => dialog.id !== dialogId),
        );
        resolveClose(result);
      },
      afterClosed: () => closePromise,
    };

    const injector = Injector.create({
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: config?.data },
      ],
      parent: this.injector,
    });

    const dialog = {
      id: dialogId,
      component,
      width: config?.width || '500px',
      maxWidth: config?.maxWidth || '90vw',
      injector,
    };

    this._dialogs.update((d) => [...d, dialog]);

    return dialogRef;
  }
}

@Component({
  selector: 'hlm-dialog-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngFor="let dialog of dialogs()"
      class="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-background/80 backdrop-blur-sm"
        (click)="closeDialog(dialog.id)"
      ></div>

      <!-- Dialog -->
      <div
        class="relative z-10 bg-background border border-border rounded-lg shadow-lg p-6"
        [style.width]="dialog.width"
        [style.max-width]="dialog.maxWidth"
      >
        <ng-container
          *ngComponentOutlet="dialog.component; injector: dialog.injector"
        ></ng-container>
      </div>
    </div>
  `,
})
export class HlmDialogContainerComponent {
  private dialogService = inject(HlmDialogService);
  dialogs = this.dialogService.dialogs;

  closeDialog(id: string) {
    // Find and close the dialog
    const dialog = this.dialogs().find((d) => d.id === id);
    if (dialog) {
      // Retrieve ref from injector if possible or just remove from list.
      // But to trigger 'afterClosed', we should call close on the ref.
      // However, the ref is inside the open method scope.
      // We can store the ref in the dialog object.
      // For now, simpler approach:
      const ref = dialog.injector.get(DialogRef);
      ref.close();
    }
  }
}
