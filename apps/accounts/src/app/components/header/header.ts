import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';
import { TranslateModule } from '@ngx-translate/core';
import {
  HlmButtonDirective,
  HlmIconComponent,
} from '../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    HlmButtonDirective,
    HlmIconComponent,
    TranslateModule,
    RouterModule,
  ],
  providers: [provideIcons({ lucideArrowLeft })],
  templateUrl: './header.html',
})
export class Header {
  title = input.required<string>();
  subtitle = input.required<string | undefined>();

  backUrl = input<string | undefined>();
  back = output<void>();
}
