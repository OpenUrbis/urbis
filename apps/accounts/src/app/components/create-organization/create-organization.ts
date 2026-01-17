import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HlmToasterService, HlmInputDirective, HlmLabelDirective, HlmButtonDirective, HlmIconComponent } from '../../../../projects/shared/src/public-api';
import { provideIcons } from '@ng-icons/core';
import { lucideLoader2 } from '@ng-icons/lucide';
import {
  IRequestCreateOrganization,
  IOrganization,
} from '../../pages/organizations/dto/organization.dto';
import { OrganizationsApi } from '../../pages/organizations/services/organizations-api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmInputDirective,
    HlmLabelDirective,
    HlmButtonDirective,
    HlmIconComponent
  ],
  providers: [provideIcons({ lucideLoader2 })],
  templateUrl: './create-organization.html',
})
export class CreateOrganization {
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl('', []),
  });

  autoAssign = input<boolean>(false);
  saveButtonText = input<string>('');
  created = output<IOrganization>();

  loading = signal<boolean>(false);

  organizationApi = inject(OrganizationsApi);
  toaster = inject(HlmToasterService);
  translate = inject(TranslateService);

  async save() {
    if (this.form.invalid) return;
    const data = this.form.value as IRequestCreateOrganization;

    this.loading.set(true);
    try {
      const organization = await firstValueFrom(
        this.autoAssign()
          ? this.organizationApi.createOwn(data)
          : this.organizationApi.create(data),
      );

      this.created.emit(organization);
    } catch (err) {
      console.error(err);
      this.toaster.error(
        this.translate.instant('components.createOrganization.errors.create'),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
