import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmIconComponent } from '../../../ui/icon/hlm-icon.component';
import { provideIcons } from '@ng-icons/core';
import { lucideXCircle, lucideCheckCircle } from '@ng-icons/lucide';

@Component({
  selector: 'lib-hint-error',
  standalone: true,
  imports: [CommonModule, HlmIconComponent],
  providers: [provideIcons({ lucideXCircle, lucideCheckCircle })],
  templateUrl: './hint-error.html',
})
export class HintError {
  errorKeys = input.required<string[]>();
  control = input.required<any>();

  hasError() {
    if (
      this.errorKeys().some((value) => {
        if (this.control().errors === null) {
          return false;
        }
        return Object.keys(this.control().errors).includes(value);
      })
    ) {
      return true;
    }
    return false;
  }
}
