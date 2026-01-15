import { Component } from '@angular/core';
import { PageStructure } from '../../components/page-structure/page-structure';
import { WhitelabelFormComponent } from '../../components/whitelabel-form/whitelabel-form';
import { TranslateModule } from '@ngx-translate/core';
import {
  HlmCardDirective,
  HlmCardContentDirective,
} from '../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-whitelabel',
  standalone: true,
  templateUrl: './whitelabel.html',
  imports: [
    WhitelabelFormComponent,
    PageStructure,
    TranslateModule,
    HlmCardDirective,
    HlmCardContentDirective,
  ],
})
export class Whitelabel { }
