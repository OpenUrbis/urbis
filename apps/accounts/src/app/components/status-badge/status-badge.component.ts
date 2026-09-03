import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { hlm } from '../../../../projects/shared/src/lib/ui/hlm/utils';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div [class]="badgeClass()">
      {{ 'components.shared.status.' + status() | translate }}
    </div>
  `,
})
export class StatusBadgeComponent {
  status = input<string | boolean>('active');

  badgeClass = computed(() => {
    const s = String(this.status()).toLowerCase();

    const base =
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

    if (s === 'active' || s === 'true') {
      return hlm(
        base,
        'border-transparent bg-green-100 text-green-800 hover:bg-green-200',
      );
    }

    if (s === 'in_analysis') {
      return hlm(
        base,
        'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      );
    }

    return hlm(
      base,
      'border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200',
    );
  });
}
