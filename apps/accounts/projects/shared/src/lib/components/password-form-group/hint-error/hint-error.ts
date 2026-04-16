import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'lib-hint-error',
  imports: [MatIconModule],
  templateUrl: './hint-error.html',
  styleUrl: './hint-error.scss',
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
