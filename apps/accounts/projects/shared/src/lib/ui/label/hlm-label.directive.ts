import { Directive, HostBinding, Input } from '@angular/core';
import { hlm } from '../hlm/utils';

@Directive({
    selector: '[hlmLabel]',
    standalone: true,
})
export class HlmLabelDirective {
    @Input() class: string = '';
    @HostBinding('class')
    get columnClass() {
        return hlm(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            this.class
        );
    }
}
