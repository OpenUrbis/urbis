import { Component } from '@angular/core';
import {
  HlmButtonDirective,
  HlmCardDirective,
  HlmCardContentDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '../../../../../../projects/shared/src/public-api';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password-sent',
  standalone: true,
  imports: [
    CommonModule,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmCardFooterDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmButtonDirective,
    RouterModule,
    TranslateModule,
  ],
  templateUrl: './forgot-password-sent.html',
})
export class ForgotPasswordSent { }
