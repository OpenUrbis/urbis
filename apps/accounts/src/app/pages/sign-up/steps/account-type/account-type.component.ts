import { Component, EventEmitter, Output } from '@angular/core';

import { HlmButtonDirective } from '../../../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-account-type',
  standalone: true,
  imports: [HlmButtonDirective],
  templateUrl: './account-type.component.html',
})
export class AccountTypeComponent {
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
}
