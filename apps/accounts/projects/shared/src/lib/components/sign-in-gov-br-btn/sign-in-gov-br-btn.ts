import { Component, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'lib-sign-in-gov-br-btn',
  imports: [TranslateModule],
  templateUrl: './sign-in-gov-br-btn.html',
  styleUrl: './sign-in-gov-br-btn.scss',
})
export class SignInGovBrBtn {
  click = output();

  clickOnButton(event: Event) {
    event.stopImmediatePropagation();
    this.click.emit();
  }
}
