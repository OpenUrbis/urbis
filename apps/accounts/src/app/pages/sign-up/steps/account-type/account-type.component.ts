import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HlmButtonDirective } from '../../../../../../projects/shared/src/public-api';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

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
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  accountTypes: AccountType[] = [
    { value: 'fisica', label: 'Pessoa física', allow: true },
    { value: 'juridica', label: 'Pessoa jurídica', allow: false },
  ];
  selected = new FormControl(this.accountTypes[0].value);

  selectedValue = toSignal(
    this.selected.valueChanges.pipe(
      map((val) => this.accountTypes.find((a) => a.value === val)),
    ),
    { initialValue: this.accountTypes[0] },
  );
  isAllow = computed(() => this.selectedValue()?.allow);
}
