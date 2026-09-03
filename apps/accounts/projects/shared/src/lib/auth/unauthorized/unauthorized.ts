import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HlmButtonDirective } from '../../../public-api';

@Component({
  selector: 'lib-unauthorized',
  imports: [CommonModule, RouterModule, TranslateModule, HlmButtonDirective],
  templateUrl: './unauthorized.html',
})
export class Unauthorized {}
