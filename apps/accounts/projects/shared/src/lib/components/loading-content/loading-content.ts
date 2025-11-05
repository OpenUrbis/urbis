import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'lib-loading-content',
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `@if (loading()) {
      <div class="d-flex justify-content-center p-5">
        <mat-spinner />
      </div>
    } @else {
      <ng-content />
    }`,
})
export class LoadingContent {
  loading = input<boolean>(false);
}
