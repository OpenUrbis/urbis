import { Component } from '@angular/core';
import { TwoFactorySetup } from './components/two-factory-setup/two-factory-setup';
import { TwoFactoryVerify } from './components/two-factory-verify/two-factory-verify';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-two-factory',
  imports: [TwoFactorySetup, TwoFactoryVerify, MatCardModule],
  templateUrl: './two-factory.html',
  styleUrl: './two-factory.scss',
})
export class TwoFactory {}
