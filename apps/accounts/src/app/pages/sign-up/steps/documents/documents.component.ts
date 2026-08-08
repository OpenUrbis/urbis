import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HlmButtonDirective } from '../../../../../../projects/shared/src/public-api';
import { AttachmentsComponent } from '../../../../../../projects/shared/src/lib/components/attachments/attachments.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmButtonDirective,
    AttachmentsComponent,
  ],
  templateUrl: './documents.component.html',
})
export class DocumentsComponent {
  @Input({ required: true }) formGroup!: FormGroup;

  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  isLoadingUpload = false;

  get documentRequiredMessage(): string {
    const type = this.formGroup.get('accountType')?.value;
    switch (type) {
      case 'fisica_emancipada':
        return 'Documentos comprobatórios da emancipação';
      case 'fisica_assistido_parental':
        return 'Documentos comprobatórios da autoridade parental';
      case 'fisica_assistido_tutor':
        return 'Documentos comprobatórios da tutela';
      default:
        return 'nenhum documento é necessario';
    }
  }

  get needsDocument(): boolean {
    const type = this.formGroup.get('accountType')?.value;
    return [
      'fisica_emancipada',
      'fisica_assistido_parental',
      'fisica_assistido_tutor',
    ].includes(type);
  }

  get canProceed(): boolean {
    if (!this.needsDocument) return true;
    if (this.isLoadingUpload) return false;

    const docs = this.formGroup.get('metadata.documents')?.value;
    return Array.isArray(docs) && docs.length > 0;
  }
}
