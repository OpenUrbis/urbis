import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '../../../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, HlmButtonDirective],
  templateUrl: './terms.component.html',
})
export class TermsComponent {
  @Output() accept = new EventEmitter<void>();
  scrolledToBottom = false;

  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    // Check if scrolled to the bottom (with a 10px buffer)
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.scrolledToBottom = true;
    }
  }
}
