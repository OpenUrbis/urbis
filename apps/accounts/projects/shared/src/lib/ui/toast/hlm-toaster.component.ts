import { Component, Injectable, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Toast {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    title?: string;
}

@Injectable({
    providedIn: 'root',
})
export class HlmToasterService {
    private readonly _toasts = signal<Toast[]>([]);
    readonly toasts = computed(() => this._toasts());

    show(message: string, options: Partial<Toast> = {}) {
        const id = Math.random().toString(36).substring(2, 9);
        const toast: Toast = { id, message, ...options };
        this._toasts.update((t) => [...t, toast]);

        setTimeout(() => {
            this.remove(id);
        }, 4000);
    }

    success(message: string, title?: string) {
        this.show(message, { type: 'success', title });
    }

    error(message: string, title?: string) {
        this.show(message, { type: 'error', title });
    }

    remove(id: string) {
        this._toasts.update((t) => t.filter((toast) => toast.id !== id));
    }
}

@Component({
    selector: 'hlm-toaster',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <div
        *ngFor="let toast of toasts()"
        class="pointer-events-auto flex w-80 flex-col rounded-lg border bg-background p-4 shadow-lg transition-all"
        [ngClass]="{
          'border-green-500 bg-green-50 text-green-900 dark:bg-green-900/10 dark:text-green-400': toast.type === 'success',
          'border-red-500 bg-red-50 text-red-900 dark:bg-red-900/10 dark:text-red-400': toast.type === 'error',
          'border-border': !toast.type || toast.type === 'info'
        }"
      >
        <div *ngIf="toast.title" class="text-sm font-semibold">{{ toast.title }}</div>
        <div class="text-sm opacity-90">{{ toast.message }}</div>
      </div>
    </div>
  `,
})
export class HlmToasterComponent {
    private toasterService = inject(HlmToasterService);
    toasts = this.toasterService.toasts;
}
