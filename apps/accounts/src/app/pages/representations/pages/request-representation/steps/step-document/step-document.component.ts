import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import {
  HlmButtonDirective,
  HlmInputDirective,
  HlmLabelDirective,
} from '../../../../../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-step-document',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterModule,
    HlmButtonDirective,
    HlmInputDirective,
    HlmLabelDirective,
  ],
  template: `
    <form [formGroup]="formGroup">
      <div class="mb-4">
        <label hlmLabel for="assignTo">
          {{ "representations.request.form.assignTo" | translate }}
        </label>
        <select hlmInput formControlName="assignTo" class="w-full" id="assignTo">
          <option value="owner">
            {{ "representations.request.form.owner" | translate }}
          </option>
          <option value="city-hall">
            {{ "representations.request.form.city-hall" | translate }}
          </option>
        </select>
      </div>
      <div class="mb-4">
        <label hlmLabel for="document">
          CPF ou CNPJ
        </label>
        <input
          hlmInput
          id="document"
          formControlName="document"
          placeholder="Digite o CPF ou CNPJ"
          (input)="onDocumentInput.emit($event)"
          maxlength="18"
        />
      </div>

      <div class="flex justify-end gap-2">
        <button hlmBtn variant="outline" routerLink="..">
          {{ "representations.request.buttons.cancel" | translate }}
        </button>
        <button hlmBtn type="button" (click)="checkDocument.emit()" [disabled]="loading || formGroup.controls['document'].invalid">
          {{ loading ? 'Aguarde...' : 'Avançar' }}
        </button>
      </div>
    </form>
  `,
})
export class StepDocumentComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() loading: boolean = false;
  @Output() onDocumentInput = new EventEmitter<any>();
  @Output() checkDocument = new EventEmitter<void>();
}
