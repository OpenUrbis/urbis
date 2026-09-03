import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostBinding,
  forwardRef,
} from '@angular/core';
import { hlm } from '../hlm/utils';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'hlm-switch',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HlmSwitchComponent),
      multi: true,
    },
  ],
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="checked"
      [attr.data-state]="checked ? 'checked' : 'unchecked'"
      (click)="toggle()"
      class="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
      [ngClass]="checked ? 'bg-primary' : 'bg-input'"
    >
      <span
        [attr.data-state]="checked ? 'checked' : 'unchecked'"
        class="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform"
        [ngClass]="checked ? 'translate-x-5' : 'translate-x-0'"
      ></span>
    </button>
  `,
})
export class HlmSwitchComponent implements ControlValueAccessor {
  @Input() checked: boolean = false;
  @Output() changed = new EventEmitter<boolean>();

  onChange: any = () => {};
  onTouch: any = () => {};

  toggle() {
    this.checked = !this.checked;
    this.changed.emit(this.checked);
    this.onChange(this.checked);
    this.onTouch();
  }

  writeValue(value: boolean): void {
    this.checked = !!value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }
}
