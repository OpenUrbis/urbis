import { Directive, HostBinding, Input } from '@angular/core';
import { hlm } from '../hlm/utils';

@Directive({
    selector: '[hlmInput]',
    standalone: true,
})
export class HlmInputDirective {
    @Input() class: string = '';
    @HostBinding('class')
    get columnClass() {
        return hlm(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            this.class
        );
    }
}
