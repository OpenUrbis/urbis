import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { WhitelabelState } from '../../states/whitelabel/whitelabel.state';

@Component({
  selector: 'app-demo-whitelabel',
  imports: [MatButtonModule],
  templateUrl: './demo-whitelabel.html',
  styleUrl: './demo-whitelabel.scss',
})
export class DemoWhitelabelComponent {
  constructor(readonly whitelabelState: WhitelabelState) {}
}
