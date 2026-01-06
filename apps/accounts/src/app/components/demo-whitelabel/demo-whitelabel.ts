import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { WhitelabelState } from '../../states/whitelabel/whitelabel.state';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-demo-whitelabel',
  imports: [MatButtonModule, TranslateModule],
  templateUrl: './demo-whitelabel.html',
  styleUrl: './demo-whitelabel.scss',
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
