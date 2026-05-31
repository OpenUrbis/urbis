import { Component, Input, HostBinding } from '@angular/core';
import { hlm } from '../hlm/utils';
import { NgIconComponent } from '@ng-icons/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'hlm-icon',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  template: `
    <ng-icon
      [name]="name"
      [size]="size"
      [strokeWidth]="strokeWidth"
      [class]="innerClass"
    />
  `,
})
export class HlmIconComponent {
  @Input() name: string = '';
  @Input() size: string = '18px';
  @Input() strokeWidth: string | number = '2';
  @Input() class: string = '';

  get innerClass() {
    return this.class.replace('animate-spin', '').trim();
  }

  @HostBinding('class')
  get columnClass() {
    return hlm(
      'inline-flex justify-center items-center align-middle',
      this.class,
    );
  }
}
