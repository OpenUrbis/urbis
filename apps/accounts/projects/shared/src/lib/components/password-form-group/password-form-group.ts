import { CommonModule } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { passwordFormGroup } from './form-group/password-form-group';
import { HintError } from './hint-error/hint-error';
import { TranslateModule } from '@ngx-translate/core';
import { HlmInputDirective } from '../../ui/input/hlm-input.directive';
import { HlmIconComponent } from '../../ui/icon/hlm-icon.component';
import { HlmButtonDirective } from '../../ui/button/hlm-button.directive';
import { HlmLabelDirective } from '../../ui/label/hlm-label.directive';
import { provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide';

@Component({
  selector: 'lib-password-form-group',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HintError,
    TranslateModule,
    HlmInputDirective,
    HlmIconComponent,
    HlmButtonDirective,
    HlmLabelDirective,
  ],
  providers: [provideIcons({ lucideEye, lucideEyeOff })],
  templateUrl: './password-form-group.html',
})
export class PasswordFormGroup {
  formGroup = input<FormGroup>(passwordFormGroup());

  hidePassword = signal<boolean>(true);
}
