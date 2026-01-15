import { Component } from '@angular/core';
import { WhitelabelState } from '../../states/whitelabel/whitelabel.state';
import { TranslateModule } from '@ngx-translate/core';
import { HlmButtonDirective } from '../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-demo-whitelabel',
  imports: [TranslateModule, HlmButtonDirective],
  templateUrl: './demo-whitelabel.html',
})
export class DemoWhitelabelComponent {
  constructor(readonly whitelabelState: WhitelabelState) {}
  toggleTheme() {
    this.whitelabelState.toggleTheme();
  }
  setPrimaryColor(desiredColor: string) {
    this.whitelabelState.setPrimaryColor(desiredColor);
  }
}
