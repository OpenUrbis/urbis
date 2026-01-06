import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { LoadingButton } from '../../../../projects/shared/src/public-api';
import {
  IRequestCreateOrganization,
  IOrganization,
} from '../../pages/organizations/dto/organization.dto';
import { OrganizationsApi } from '../../pages/organizations/services/organizations-api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-create-organization',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingButton,
    TranslateModule,
  ],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.scss',
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
  matSnackBar = inject(MatSnackBar);
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
      this.matSnackBar.open(
        this.translate.instant('components.createOrganization.errors.create'),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
