import { Component } from '@angular/core';
import { PageStructure } from '../../components/page-structure/page-structure';
import { WhitelabelFormComponent } from '../../components/whitelabel-form/whitelabel-form';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-whitelabel',
  templateUrl: './whitelabel.html',
  styleUrl: './whitelabel.scss',
  imports: [
    WhitelabelFormComponent,
    PageStructure,
    TranslateModule,
    MatCardModule,
  ],
})
export class Whitelabel {}
