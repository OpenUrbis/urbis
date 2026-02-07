import {
  Component,
  EventEmitter,
  Output,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { OrganizationState } from '../../states/organization/organization.state';
import { OrganizationsApi } from '../../pages/organizations/services/organizations-api';
import { WhitelabelApi } from '../../states/whitelabel/whitelabel.service';
import { WhitelabelState } from '../../states/whitelabel/whitelabel.state';
import { ApplicationTheme } from '../../states/whitelabel/whitelabel.types';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import {
  UploadStrategyPathEnum,
  HlmInputDirective,
  HlmLabelDirective,
  HlmButtonDirective,
  HlmIconComponent,
  HlmToasterService,
} from '../../../../projects/shared/src/public-api';
import { environment } from '../../../environments/environment';
import { provideIcons } from '@ng-icons/core';
import { lucideLoader2, lucideSave, lucideCheck, lucideX, lucideChevronsUpDown } from '@ng-icons/lucide';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HlmInputDirective,
    HlmLabelDirective,
    HlmButtonDirective,
    HlmIconComponent,
    TranslateModule,
  ],
  providers: [provideIcons({ lucideLoader2, lucideSave, lucideCheck, lucideX, lucideChevronsUpDown })],
  selector: 'app-whitelabel-form',
  templateUrl: './whitelabel-form.html',
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
    organizationName: new FormControl('', [Validators.required]),
    organizationType: new FormControl(''),
    tenantType: new FormControl('mono'),
    organizationTypes: new FormControl<string[]>([]),
    newOrgType: new FormControl(''),
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

  private toaster = inject(HlmToasterService);
  private organizationState = inject(OrganizationState);
  private organizationsApi = inject(OrganizationsApi);
  private whitelabelState = inject(WhitelabelState);
  private whitelabelApi = inject(WhitelabelApi);
  private translate = inject(TranslateService);

  constructor() {
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
            organizationName: organization.name,
            organizationType: organization.metadata?.organizationType,
            tenantType: organization.metadata?.tenantType ?? 'mono',
            organizationTypes: (organization.metadata?.organizationTypes?.length > 0)
              ? organization.metadata.organizationTypes
              : ['Secretaria'],
          });
          this.removeLoadingStep();
        });
    });
  }

  onSubmit() {
    if (this.formGroup.invalid) return;

    this.addLoadingStep();
    const formValue = this.formGroup.value;
    const organizationId = this.organizationState.selectedOrganization()!.id;

    const updateWhitelabel$ = this.whitelabelApi.updateOrganizationWhitelabel(
      organizationId,
      {
        primaryColor: formValue.brandColor,
        theme: formValue.defaultTheme as ApplicationTheme,
      },
    );

    const updateOrg$ = this.organizationsApi.update(organizationId, {
      name: formValue.organizationName!,
      metadata: {
        ...this.organizationState.selectedOrganization()!.metadata,
        organizationType: formValue.organizationType,
        tenantType: formValue.tenantType,
        organizationTypes: formValue.organizationTypes,
      },
    });

    forkJoin([updateWhitelabel$, updateOrg$]).subscribe({
      error: () => {
        this.removeLoadingStep();
        this.toaster.error(this.translate.instant('common.errors.save'));
      },
      next: () => {
        this.removeLoadingStep();
        this.whitelabelState.reload();
        this.organizationState.refresh();
        this.toaster.success(this.translate.instant('common.success.saved'));
        this.success.next({
          organizationId,
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

  addOrgType() {
    const newType = this.formGroup.get('newOrgType')?.value?.trim();
    if (!newType) return;

    const currentTypes = this.formGroup.get('organizationTypes')?.value || [];
    if (!currentTypes.includes(newType)) {
      this.formGroup.get('organizationTypes')?.setValue([...currentTypes, newType]);
      this.formGroup.get('organizationTypes')?.markAsDirty();
    }
    this.formGroup.get('newOrgType')?.setValue('');
  }

  removeOrgType(index: number) {
    const currentTypes = this.formGroup.get('organizationTypes')?.value || [];
    currentTypes.splice(index, 1);
    this.formGroup.get('organizationTypes')?.setValue([...currentTypes]);
    this.formGroup.get('organizationTypes')?.markAsDirty();
  }
}
