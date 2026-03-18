import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  HlmButtonDirective,
  HlmInputDirective,
  HlmLabelDirective,
} from '../../../../../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-step-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmButtonDirective,
    HlmInputDirective,
    HlmLabelDirective,
  ],
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="goToStep3.emit()">
      @if (isCnpj) {
        <div class="mb-4">
          <label hlmLabel for="companyName">Razão Social</label>
          <input hlmInput id="companyName" formControlName="companyName" class="w-full" />
        </div>
        <div class="mb-4">
          <label hlmLabel for="tradeName">Nome Fantasia</label>
          <input hlmInput id="tradeName" formControlName="tradeName" class="w-full" />
        </div>
      } @else {
        <div class="mb-4">
          <label hlmLabel for="name">Nome</label>
          <input hlmInput id="name" formControlName="name" class="w-full" />
        </div>
        <div class="mb-4">
          <label hlmLabel for="socialName">Nome Social (opcional)</label>
          <input hlmInput id="socialName" formControlName="socialName" class="w-full" />
        </div>
      }

      <div class="mb-4">
        <label hlmLabel for="representationType">Tipo de representação</label>
        <select hlmInput formControlName="representationType" id="representationType" class="w-full">
          <option value="">Selecione...</option>
          @for (type of representationTypes; track type.value) {
            <option [value]="type.value">{{ type.label }}</option>
          }
        </select>
      </div>

      <div class="mb-4">
        <label hlmLabel for="justification">
          {{ "representations.request.form.justification" | translate }} (opcional)
        </label>
        <textarea
          hlmInput
          id="justification"
          formControlName="justification"
          rows="4"
          class="w-full h-auto"
        ></textarea>
      </div>

      <div class="flex justify-end gap-2">
        <button hlmBtn variant="outline" type="button" (click)="goBack.emit()">
          Voltar
        </button>
        <button hlmBtn type="submit" [disabled]="formGroup.controls['representationType'].invalid || (isCnpj ? formGroup.controls['companyName'].invalid : formGroup.controls['name'].invalid)">
          Avançar
        </button>
      </div>
    </form>
  `,
})
export class StepDetailsComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() isCnpj: boolean = false;
  @Input() representationTypes: { value: string; label: string }[] = [];

  @Output() goBack = new EventEmitter<void>();
  @Output() goToStep3 = new EventEmitter<void>();
}
