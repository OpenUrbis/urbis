import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { WhitelabelService } from '../../services/whitelabel/whitelabel.service';

@Component({
  selector: 'app-demo-whitelabel',
  imports: [MatButtonModule],
  templateUrl: './demo-whitelabel.html',
  styleUrl: './demo-whitelabel.scss',
})
export class DemoWhitelabelComponent {
  constructor(readonly whitelabelService: WhitelabelService) {}
}
