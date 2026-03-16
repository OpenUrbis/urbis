import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HlmButtonDirective } from '../../../../../../projects/shared/src/public-api';

export interface AccountType {
  value: string;
  label: string;
  allow: boolean;
}

@Component({
  selector: 'app-account-type',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HlmButtonDirective],
  templateUrl: './account-type.component.html',
})
export class AccountTypeComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input({ required: true }) accountTypes!: AccountType[];
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  selectedType: AccountType | null = null;

  onSelect(type: AccountType) {
    this.selectedType = type;
  }
}
