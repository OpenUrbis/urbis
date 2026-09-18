import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import {
  HlmCardContentDirective,
  HlmCardDirective,
  HlmToasterService,
} from '../../../../../../projects/shared/src/public-api';
import { OpenCnpjApi } from '../../services/open-cnpj-api';
import { RepresentationApi } from '../../services/representation-api';

import { StepDetailsComponent } from './steps/step-details/step-details.component';
import { StepDocumentComponent } from './steps/step-document/step-document.component';
import { anonymizePersonName } from './steps/step-document/anonymize-person-name';

type DocumentCategory = {
  category: string;
  files: unknown[];
};

type DocumentCategoryDefinition = {
  category: string;
  label: string;
};

@Component({
  selector: 'app-request-representation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmCardDirective,
    HlmCardContentDirective,
    StepDocumentComponent,
    StepDetailsComponent,
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
    documents: new FormControl<DocumentCategory[]>([], [
      this.requiredDocumentsValidator(),
    ]),
    hasOtherRepresentatives: new FormControl(false),
    otherRepresentatives: new FormControl<string[]>([]),
  });

  loading = signal(false);
  cnpjLookupMessage = signal('');

  representationTypes: {
    value: string;
    label: string;
    description: string;
    docType: string;
    isRare?: boolean;
  }[] = [
    // Mais Comuns (Exibidos por padrão)
    {
      value: 'representative',
      label: 'Representante de Pessoa Jurídica',
      description:
        'Representação de empresas, associações ou fundações com base no Contrato Social, Estatuto ou Ata.',
      docType: 'CNPJ',
    },
    {
      value: 'attorney',
      label: 'Procurador de Pessoa Física',
      description:
        'Representação voluntária de outra pessoa física capaz mediante instrumento de Mandato (Procuração).',
      docType: 'CPF',
    },
    {
      value: 'parental_authority_incapable',
      label: 'Pai ou Mãe de Menor Incapaz (Até 16 anos)',
      description:
        'Destinado à representação legal de filho menor de 16 anos pelo pai ou mãe, exigindo a Certidão de Nascimento.',
      docType: 'CPF',
    },
    {
      value: 'syndic_or_administrator',
      label: 'Síndico de Condomínio Edilício',
      description:
        'Representação legal do condomínio com base na Convenção registrada e na Ata da Assembleia que elegeu o síndico.',
      docType: 'CNPJ',
    },
    {
      value: 'executor',
      label: 'Inventariante de Espólio',
      description:
        'Representação legal do conjunto de bens e direitos deixados por uma pessoa falecida (espólio).',
      docType: 'CPF',
    },
    {
      value: 'parental_authority_relatively_incapable',
      label: 'Pai ou Mãe de Relativamente Incapaz (16 a 18 anos)',
      description:
        'Destinado à assistência ou representação de filho entre 16 e 18 anos pelo pai ou mãe, com base no poder familiar.',
      docType: 'CPF',
    },
    // Menos Comuns / Casos Específicos (Ocultos por padrão)
    {
      value: 'tutor_incapable',
      label: 'Tutor de Menor Incapaz',
      description:
        'Representação de menor órfão ou cujos pais foram destituídos do poder familiar, exigindo Termo de Tutela.',
      docType: 'CPF',
      isRare: true,
    },
    {
      value: 'curator_incapable',
      label: 'Curador de Incapaz',
      description:
        'Representação de maior de idade sem discernimento para os atos civis, exigindo Termo de Curatela.',
      docType: 'CPF',
      isRare: true,
    },
    {
      value: 'bankruptcy_trustee',
      label: 'Administrador Judicial de Massa Falida',
      description:
        'Representação legal da empresa sob processo de falência, exigindo Sentença Judicial declaratória.',
      docType: 'CNPJ',
      isRare: true,
    },
    {
      value: 'civil_insolvency_administrator',
      label: 'Administrador do Insolvente Civil',
      description:
        'Representação da massa de bens do devedor insolvente na execução por concurso universal.',
      docType: 'CNPJ',
      isRare: true,
    },
    {
      value: 'curator_of_vacant_heritage',
      label: 'Curador de Herança Jacente ou Vacante',
      description:
        'Representação temporária de herança sem herdeiros legítimos conhecidos.',
      docType: 'CPF',
      isRare: true,
    },
  ];

  constructor() {
    this.form.controls.representationType.valueChanges.subscribe(() => {
      this.form.patchValue({
        document: '',
        companyName: '',
        tradeName: '',
        name: '',
        socialName: '',
        documents: [],
        hasOtherRepresentatives: false,
        otherRepresentatives: [],
      });
      this.cnpjLookupMessage.set('');
      this.updateRepresentedPersonValidators();
      this.form.controls.documents.updateValueAndValidity();
    });

    this.updateRepresentedPersonValidators();
  }

  isCnpj() {
    const type = this.form.get('representationType')?.value;
    const selectedType = this.representationTypes.find((t) => t.value === type);
    return selectedType?.docType === 'CNPJ';
  }

  getSelectedTypeLabel() {
    const type = this.form.get('representationType')?.value;
    const selected = this.representationTypes.find((t) => t.value === type);
    return selected ? selected.label : '';
  }

  onDocumentInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    const isCnpj = this.isCnpj();

    if (isCnpj) {
      if (value.length > 14) {
        value = value.substring(0, 14);
      }
      value = value.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/,
        '$1.$2.$3/$4-$5',
      );
    } else {
      if (value.length > 11) {
        value = value.substring(0, 11);
      }
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
    if (this.loading() || !this.isCnpj()) return;

    const cnpj = (this.form.controls.document.value ?? '').replace(/\D/g, '');
    if (cnpj.length !== 14) {
      this.form.controls.document.setErrors({ invalidCnpj: true });
      this.form.controls.document.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.cnpjLookupMessage.set('');
    try {
      const representationType =
        this.form.controls.representationType.value || undefined;
      const data: any = await firstValueFrom(
        this.representationApi.checkDocument(cnpj, representationType),
      );
      this.form.patchValue({
        companyName:
          data?.name ??
          data?.companyName ??
          data?.razao_social ??
          data?.razaoSocial ??
          '',
        tradeName:
          data?.metadata?.socialName ??
          data?.metadata?.tradeName ??
          data?.tradeName ??
          data?.nome_fantasia ??
          data?.nomeFantasia ??
          '',
      });
      this.cnpjLookupMessage.set(
        'Os dados cadastrais foram consultados na OpenCNPJ. Caso estejam incorretos ou desatualizados, revise e corrija os campos abaixo antes de enviar a solicitação.',
      );
    } catch (e: any) {
      console.error(e);
      const backendMessage = e?.error?.message;
      if (backendMessage) {
        this.cnpjLookupMessage.set(
          this.translate.instant(backendMessage),
        );
      } else {
        this.cnpjLookupMessage.set(
          'Não foi possível obter dados no OpenCNPJ. Preencha os dados manualmente.',
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  goToStep2() {
    if (this.form.controls.representationType.invalid) {
      this.form.controls.representationType.markAsTouched();
      return;
    }
    this.step.set(2);
  }


  goBack() {
    this.step.set(this.step() - 1);
  }

  private updateRepresentedPersonValidators() {
    this.form.controls.document.setValidators([
      Validators.required,
      Validators.pattern(
        this.isCnpj()
          ? /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
          : /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
      ),
    ]);
    this.form.controls.companyName.setValidators(
      this.isCnpj() ? [Validators.required] : [],
    );
    this.form.controls.name.setValidators(this.isCnpj() ? [] : [Validators.required]);
    this.form.controls.document.updateValueAndValidity({ emitEvent: false });
    this.form.controls.companyName.updateValueAndValidity({ emitEvent: false });
    this.form.controls.name.updateValueAndValidity({ emitEvent: false });
  }

  private requiredDocumentsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const documents = control.value as DocumentCategory[] | null;
      // During FormGroup field initialization, `this.form` is not assigned yet.
      // Resolve the type from the parent control so validation is safe at that point.
      const representationType = control.parent?.get('representationType')?.value;
      const requiredCategories = this.getRequiredDocumentsInfo(representationType).map(
        ({ category }) => category,
      );
      const missingCategories = requiredCategories.filter(
        (category) =>
          !documents?.some(
            (document) =>
              document.category === category &&
              Array.isArray(document.files) &&
              document.files.length > 0,
          ),
      );

      return missingCategories.length > 0
        ? { requiredDocumentCategories: missingCategories }
        : null;
    };
  }

  getRequiredDocumentsInfo(type = this.form?.controls.representationType?.value): DocumentCategoryDefinition[] {
    switch (type) {
      case 'attorney':
        return [{ category: 'power_of_attorney', label: 'Procuração' }];
      case 'parental_authority_incapable':
      case 'parental_authority_relatively_incapable':
        return [
          {
            category: 'parental_authority',
            label: 'Documentos comprobatórios da autoridade parental (Certidão de nascimento)',
          },
        ];
      case 'tutor_incapable':
        return [{ category: 'guardianship', label: 'Documentos comprobatórios da tutela (Termo de tutela)' }];
      case 'curator_incapable':
        return [{ category: 'curatorship', label: 'Documentos comprobatórios da curatela (Termo de curatela)' }];
      case 'executor':
        return [
          {
            category: 'executor_appointment',
            label: 'Nomeação judicial e compromisso do inventariante',
          },
        ];
      case 'curator_of_vacant_heritage':
        return [
          {
            category: 'curator_appointment',
            label: 'Nomeação judicial e Compromisso do curador',
          },
        ];
      case 'representative':
        return [
          {
            category: 'constitutive_documents',
            label: 'Documentos constitutivos da pessoa jurídica (Contrato Social / Estatuto)',
          },
          {
            category: 'representation_documents',
            label: 'Documentos demonstrativos da representação da pessoa jurídica',
          },
        ];
      case 'bankruptcy_trustee':
        return [{ category: 'bankruptcy_sentence', label: 'Sentença declaratória de falência' }];
      case 'civil_insolvency_administrator':
        return [
          { category: 'insolvency_sentence', label: 'Sentença declaratória de insolvência' },
        ];
      case 'syndic_or_administrator':
        return [
          { category: 'condominium_convention', label: 'Convenção do condomínio' },
          { category: 'syndic_assembly_minutes', label: 'Ata de assembleia que elegeu o síndico' },
        ];
      default:
        return [];
    }
  }

  async submit() {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      const formValue = { ...this.form.getRawValue() };

      if (!this.isCnpj()) {
        formValue.name = anonymizePersonName(formValue.name);
        formValue.socialName = anonymizePersonName(formValue.socialName);
        this.form.patchValue(
          { name: formValue.name, socialName: formValue.socialName },
          { emitEvent: false },
        );
      }

      if (!formValue.hasOtherRepresentatives) {
        formValue.otherRepresentatives = [];
      }

      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }

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
