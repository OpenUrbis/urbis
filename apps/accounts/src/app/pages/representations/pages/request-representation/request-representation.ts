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
  AttachmentsComponent,
  HlmButtonDirective,
  HlmCardContentDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmInputDirective,
  HlmLabelDirective,
  HlmToasterService,
} from '../../../../../../projects/shared/src/public-api';
import { SolicitationApi } from '../../services/solicitation-api';

@Component({
  selector: 'app-request-representation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmButtonDirective,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardContentDirective,
    HlmInputDirective,
    HlmLabelDirective,
    AttachmentsComponent,
  ],
  templateUrl: './request-representation.html',
})
export class RequestRepresentation {
  solicitationApi = inject(SolicitationApi);
  router = inject(Router);
  toaster = inject(HlmToasterService);
  translate = inject(TranslateService);

  form = new FormGroup({
    document: new FormControl('', [Validators.required]),
    justification: new FormControl(''),
    documents: new FormControl([]),
  });

  isDirectAccess = signal(false);
  showManualForm = signal(false);
  loading = signal(false);

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
      const available = await firstValueFrom(
        this.solicitationApi.getAvailable(),
      );
      const match = (available as any[]).find((a) => a.document === doc);

      if (match) {
        this.isDirectAccess.set(true);
        this.showManualForm.set(false);
        this.form.controls.justification.clearValidators();
        this.form.controls.documents.clearValidators();
      } else {
        this.isDirectAccess.set(false);
        this.showManualForm.set(true);
        this.form.controls.justification.setValidators([Validators.required]);
        this.form.controls.documents.clearValidators(); // Documents are now optional
      }
      this.form.controls.justification.updateValueAndValidity();
      this.form.controls.documents.updateValueAndValidity();
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  async submit() {
    this.loading.set(true);
    try {
      const formValue = { ...this.form.value };
      if (formValue.document) {
        formValue.document = formValue.document.replace(/\D/g, '');
      }

      await firstValueFrom(this.solicitationApi.request(formValue));
      this.toaster.success(
        this.translate.instant('representations.request.messages.success'),
      );
      this.router.navigate(['/representations']);
    } catch (err: any) {
      this.toaster.error(
        this.translate.instant('representations.request.messages.error'),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
