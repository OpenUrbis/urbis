import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import {
  HlmCardContentDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmToasterService,
} from '../../../../../../projects/shared/src/public-api';
import { OpenCnpjApi } from '../../services/open-cnpj-api';
import { RepresentationApi } from '../../services/representation-api';

import { StepDetailsComponent } from './steps/step-details/step-details.component';
import { StepDocumentComponent } from './steps/step-document/step-document.component';
import { StepUploadComponent } from './steps/step-upload/step-upload.component';

@Component({
  selector: 'app-request-representation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardContentDirective,
    StepDocumentComponent,
    StepDetailsComponent,
    StepUploadComponent,
  ],
  templateUrl: './request-representation.html',
})
export class RequestRepresentation {
  representationApi = inject(RepresentationApi);
  openCnpjApi = inject(OpenCnpjApi);
  router = inject(Router);
  toaster = inject(HlmToasterService);
  translate = inject(TranslateService);

  step = signal(1);

  form = new FormGroup({
    document: new FormControl('', [Validators.required]),
    representationType: new FormControl('', [Validators.required]),
    companyName: new FormControl(''),
    tradeName: new FormControl(''),
    name: new FormControl(''),
    socialName: new FormControl(''),
    justification: new FormControl(''),
    documents: new FormControl([]),
    assignTo: new FormControl('owner'),
  });

  isDirectAccess = signal(false);
  showManualForm = signal(false);
  loading = signal(false);

  representationTypes = [
    { value: 'attorney', label: 'Procurador' },
    { value: 'parental_authority', label: 'Autoridade parental' },
    { value: 'tutor', label: 'Tutor' },
    { value: 'curator', label: 'Curador' },
    { value: 'executor', label: 'Inventariante' },
    {
      value: 'curator_of_vacant_heritage',
      label: 'Curador da herança jacente ou vacante',
    },
    { value: 'representative', label: 'Representante' },
    { value: 'bankruptcy_trustee', label: 'Administrador da massa falida' },
    {
      value: 'civil_insolvency_administrator',
      label: 'Administrador do insolvente civil',
    },
    { value: 'syndic_or_administrator', label: 'Síndico ou Administrador' },
  ];

  isCnpj() {
    const doc = this.form.get('document')?.value || '';
    return doc.replace(/\D/g, '').length === 14;
  }

  onDocumentInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length > 14) {
      value = value.substring(0, 14);
    }

    if (value.length > 11) {
      // CNPJ mask: 00.000.000/0000-00
      value = value.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/,
        '$1.$2.$3/$4-$5',
      );
    } else {
      // CPF mask: 000.000.000-00
      if (value.length > 9) {
        value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9)}`;
      } else if (value.length > 6) {
        value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6)}`;
      } else if (value.length > 3) {
        value = `${value.substring(0, 3)}.${value.substring(3)}`;
      }
    }

    this.form.get('document')?.setValue(value, { emitEvent: false });
  }

  async checkDocument() {
    let doc = this.form.get('document')?.value;
    if (!doc) return;

    doc = doc.replace(/\D/g, '');

    this.loading.set(true);
    try {
      // Re-enable fields to allow fresh typing if data changes
      this.form.controls.companyName.enable();
      this.form.controls.tradeName.enable();
      this.form.controls.name.enable();
      this.form.controls.socialName.enable();

      const orgData: any = await firstValueFrom(
        this.representationApi.checkDocument(doc),
      );

      if (this.isCnpj()) {
        if (orgData) {
          this.form.patchValue({
            companyName: orgData.name || '',
            tradeName: orgData.metadata?.socialName || orgData.metadata?.tradeName || '',
          });

          if (orgData.name) {
            this.form.controls.companyName.disable();
          }
          if (orgData.metadata?.socialName || orgData.metadata?.tradeName) {
            this.form.controls.tradeName.disable();
          }
        }

        this.form.controls.companyName.setValidators([Validators.required]);
        this.form.controls.tradeName.setValidators([Validators.required]);

        this.form.controls.name.clearValidators();
        this.form.controls.socialName.clearValidators();
      } else {
        if (orgData) {
          this.form.patchValue({
            name: orgData.name || '',
            socialName: orgData.metadata?.socialName || '',
          });

          if (orgData.name) {
            this.form.controls.name.disable();
          }
          if (orgData.metadata?.socialName) {
            this.form.controls.socialName.disable();
          }
        }

        this.form.controls.name.setValidators([Validators.required]);
        this.form.controls.socialName.clearValidators();

        this.form.controls.companyName.clearValidators();
        this.form.controls.tradeName.clearValidators();
      }

      this.form.controls.companyName.updateValueAndValidity();
      this.form.controls.tradeName.updateValueAndValidity();
      this.form.controls.name.updateValueAndValidity();
      this.form.controls.socialName.updateValueAndValidity();

      this.step.set(2);
    } catch (e: any) {
      console.error(e);
      if (e?.error?.message) {
        this.toaster.error(this.translate.instant(e.error.message));
      } else {
        this.toaster.error(
          this.translate.instant('representations.request.messages.api_error'),
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  goToStep3() {
    if (
      this.form.controls.representationType.invalid ||
      (this.isCnpj() &&
        (this.form.controls.companyName.invalid ||
          this.form.controls.tradeName.invalid)) ||
      (!this.isCnpj() && this.form.controls.name.invalid)
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.step.set(3);
  }

  goBack() {
    this.step.set(this.step() - 1);
  }

  getRequiredDocumentsInfo() {
    const type = this.form.get('representationType')?.value;
    switch (type) {
      case 'attorney':
        return ['Procuração'];
      case 'parental_authority':
        return ['Documentos comprobatórios da autoridade parental'];
      case 'tutor':
        return ['Documentos comprobatórios da tutela'];
      case 'curator':
        return ['Documentos comprobatórios da curatela'];
      case 'executor':
        return ['Nomeação judicial e compromisso do inventariante'];
      case 'curator_of_vacant_heritage':
        return ['Sentença declaratória de insolvência'];
      case 'representative':
        return [
          'Documentos constitutivos da pessoa jurídica',
          'Documentos demonstrativos da representação da pessoa jurídica',
        ];
      case 'bankruptcy_trustee':
        return ['Sentença declaratória de falência'];
      case 'civil_insolvency_administrator':
        return ['Sentença declaratória de insolvência'];
      case 'syndic_or_administrator':
        return [
          'Convenção do condomínio',
          'Ata de assembleia que elegeu o síndico',
        ];
      default:
        return [];
    }
  }

  async submit() {
    this.loading.set(true);
    try {
      const formValue = { ...this.form.getRawValue() };
      if (formValue.document) {
        formValue.document = formValue.document.replace(/\D/g, '');
      }

      await firstValueFrom(this.representationApi.request(formValue));
      this.toaster.success(
        this.translate.instant('representations.request.messages.success'),
      );
      this.router.navigate(['/representations']);
    } catch (err: any) {
      if (err?.error?.message)
        return this.toaster.error(this.translate.instant(err.error.message));
      this.toaster.error(
        this.translate.instant('representations.request.messages.error'),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
