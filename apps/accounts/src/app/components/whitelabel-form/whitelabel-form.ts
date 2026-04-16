import {
  Component,
  EventEmitter,
  Output,
  signal,
  computed,
  effect,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrganizationState } from '../../states/organization/organization.state';
import { WhitelabelApi } from '../../states/whitelabel/whitelabel.service';
import { WhitelabelState } from '../../states/whitelabel/whitelabel.state';
import { ApplicationTheme } from '../../states/whitelabel/whitelabel.types';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import {
  FileUploaderComponent,
  UploadStrategyPathEnum,
} from '../../../../projects/shared/src/public-api';
import { environment } from '../../../environments/environment';

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatCardModule,
    MatSnackBarModule,
    FileUploaderComponent,
  ],
  selector: 'app-whitelabel-form',
  templateUrl: './whitelabel-form.html',
  styleUrls: ['./whitelabel-form.scss'],
})
export class WhitelabelFormComponent {
  loadingStep = signal(0);
  loading = computed(() => this.loadingStep() > 0);

  @Output()
  success = new EventEmitter();

  formGroup = new FormGroup({
    brandColor: new FormControl('#1840dc', [
      Validators.required,
      Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    ]),
    defaultTheme: new FormControl('light', [Validators.required]),
  });

  logotypeDarkSrc = computed(
    () =>
      `${environment.s3EndpointPublic}/logos/${this.organizationId()}-logotype-dark`,
  );
  logotypeSrc = computed(
    () =>
      `${environment.s3EndpointPublic}/logos/${this.organizationId()}-logotype-light`,
  );
  logomarkDarkSrc = computed(
    () =>
      `${environment.s3EndpointPublic}/logos/${this.organizationId()}-logomark-dark`,
  );
  logomarkSrc = computed(
    () =>
      `${environment.s3EndpointPublic}/logos/${this.organizationId()}-logomark-light`,
  );

  organizationId = computed(() => {
    return this.organizationState.selectedOrganization()?.id;
  });
  logomark = computed(() => {
    return UploadStrategyPathEnum.LOGOMARK;
  });
  logotype = computed(() => {
    return UploadStrategyPathEnum.LOGOTYPE;
  });

  constructor(
    private matSnackBar: MatSnackBar,
    private organizationState: OrganizationState,
    private whitelabelState: WhitelabelState,
    private whitelabelApi: WhitelabelApi,
  ) {
    this.addLoadingStep();
    this.organizationState.refresh();
    effect(() => {
      const organization = this.organizationState.selectedOrganization();
      if (this.organizationState.loading() || !organization?.id) return;
      this.whitelabelApi
        .getOrganizationWhitelabel(organization.id)
        .subscribe((value) => {
          this.formGroup.patchValue({
            brandColor: value.shared?.primaryColor ?? '#1840dc',
            defaultTheme: value.application?.theme ?? 'light',
          });
          this.removeLoadingStep();
        });
    });
  }

  onSubmit() {
    if (this.formGroup.invalid) return;

    this.addLoadingStep();
    const formValue = this.formGroup.value;

    this.whitelabelApi
      .updateOrganizationWhitelabel(
        this.organizationState.selectedOrganization()!.id,
        {
          primaryColor: formValue.brandColor,
          theme: formValue.defaultTheme as ApplicationTheme,
        },
      )
      .subscribe({
        error: () => {
          this.removeLoadingStep();
        },
        next: () => {
          this.removeLoadingStep();
          this.whitelabelState.reload();
          this.success.next({
            organizationId: this.organizationState.selectedOrganization()!.id,
          });
        },
      });
  }

  addLoadingStep() {
    this.loadingStep.set(this.loadingStep() + 1);
  }

  removeLoadingStep() {
    this.loadingStep.set(this.loadingStep() - 1);
  }
}
