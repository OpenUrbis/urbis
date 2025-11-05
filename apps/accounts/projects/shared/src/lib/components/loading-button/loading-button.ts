import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'lib-loading-button',
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <button
      matButton="filled"
      [type]="type()"
      [disabled]="loading()"
      (click)="click.emit()"
    >
      @if (loading()) {
        <mat-spinner [diameter]="20" />
      } @else {
        <ng-content />
      }
    </button>
  `,
})
export class LoadingButton {
  loading = input<boolean>(false);
  type = input<'submit' | 'reset' | 'button'>('submit');

  click = output();
}
