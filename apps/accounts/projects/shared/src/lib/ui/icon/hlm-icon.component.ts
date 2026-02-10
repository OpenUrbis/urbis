import { Component, Input, HostBinding, computed, signal } from '@angular/core';
import { hlm } from '../hlm/utils';
import { NgIconComponent } from '@ng-icons/core';
import { CommonModule } from '@angular/common';

const DEFINED_SIZES = {
  xs: '12px',
  sm: '16px',
  base: '18px',
  lg: '24px',
  xl: '32px',
  none: '100%',
} as const;

type DefinedSizes = keyof typeof DEFINED_SIZES;

@Component({
  selector: 'hlm-icon',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  template: `
    <ng-icon
      [name]="name"
      [size]="computedSize"
      [strokeWidth]="strokeWidth"
      [class]="innerClass"
    />
  `,
})
export class HlmIconComponent {
  @Input() name: string = '';

  private _size = signal<string | DefinedSizes>('base');
  @Input()
  set size(value: string | DefinedSizes) {
    this._size.set(value);
  }

  @Input() strokeWidth: string | number = '2';
  @Input() class: string = '';

  get computedSize(): string {
    const size = this._size();
    if (size in DEFINED_SIZES) {
      return DEFINED_SIZES[size as DefinedSizes];
    }
    return size;
  }

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
