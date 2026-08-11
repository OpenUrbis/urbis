import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  AttachmentsComponent,
  HlmButtonDirective,
  HlmLabelDirective,
} from '../../../../../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-step-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmButtonDirective,
    HlmLabelDirective,
    AttachmentsComponent,
  ],
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="submit.emit()">
      <div class="mb-4">
        <label hlmLabel>
          Documentos requeridos
        </label>
        <ul class="list-disc pl-5 mb-4">
          @for (doc of getRequiredDocumentsInfo(); track doc) {
            <li>{{ doc }}</li>
          }
        </ul>

        <lib-attachments formControlName="documents" />
      </div>

      <div class="flex justify-end gap-2">
        <button hlmBtn variant="outline" type="button" (click)="goBack.emit()">
          Voltar
        </button>
        <button hlmBtn type="submit" [disabled]="loading || formGroup.controls['documents'].invalid || !formGroup.controls['documents'].value?.length">
          {{
            loading
              ? ("representations.request.buttons.submitting" | translate)
              : ("representations.request.buttons.submit" | translate)
          }}
        </button>
      </div>
    </form>
  `,
})
export class StepUploadComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() loading: boolean = false;

  @Output() goBack = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  getRequiredDocumentsInfo() {
    const type = this.formGroup.get('representationType')?.value;
    switch(type) {
      case 'attorney': return ['Procuração'];
      case 'parental_authority': return ['Documentos comprobatórios da autoridade parental'];
      case 'tutor': return ['Documentos comprobatórios da tutela'];
      case 'curator': return ['Documentos comprobatórios da curatela'];
      case 'executor': return ['Nomeação judicial e compromisso do inventariante'];
      case 'curator_of_vacant_heritage': return ['Sentença declaratória de insolvência'];
      case 'representative': return ['Documentos constitutivos da pessoa jurídica', 'Documentos demonstrativos da representação da pessoa jurídica'];
      case 'bankruptcy_trustee': return ['Sentença declaratória de falência'];
      case 'civil_insolvency_administrator': return ['Sentença declaratória de insolvência'];
      case 'syndic_or_administrator': return ['Convenção do condomínio', 'Ata de assembleia que elegeu o síndico'];
      default: return [];
    }
  }
}
