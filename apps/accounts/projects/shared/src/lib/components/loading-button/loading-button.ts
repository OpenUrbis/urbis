import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonAppearance, MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'lib-loading-button',
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <button
      [matButton]="apperance()"
      [type]="type()"
      [disabled]="loading()"
      (click)="clickOnButton($event)"
      [disabled]="disabled()"
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
  apperance = input<MatButtonAppearance>('filled');
  disabled = input<boolean>(false);

  click = output();

  clickOnButton(event: Event) {
    event.stopImmediatePropagation();
    this.click.emit();
  }
}
