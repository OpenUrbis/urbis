import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HlmButtonDirective } from '../../../../../../projects/shared/src/public-api';
import { AttachmentsComponent } from '../../../../../../projects/shared/src/lib/components/attachments/attachments.component';
import { UserFormComponent } from '../../../../components/user-form/user-form';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmButtonDirective,
    AttachmentsComponent,
    UserFormComponent,
  ],
  templateUrl: './documents.component.html',
})
export class DocumentsComponent {
  @Input({ required: true }) formGroup!: FormGroup;

  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  isLoadingUpload = false;

  get documentRequiredMessage(): string {
    const texts: any = {
      fisica_emancipada: 'Documentos comprobatórios da emancipação',
      fisica_assistido_parental:
        'Documentos comprobatórios da autoridade parental',
      fisica_assistido_tutor: 'Documentos comprobatórios da tutela',
    };
    const type = this.formGroup.get('accountType')?.value;

    return (
      texts[type] ??
      'Nenhum documento adicional é necessário para o tipo de conta selecionado.'
    );
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
