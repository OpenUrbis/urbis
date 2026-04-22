import { Directive, HostBinding, Input } from '@angular/core';
import { hlm } from '../hlm/utils';

@Directive({
    selector: '[hlmMenu]',
    standalone: true,
})
export class HlmMenuDirective {
    @Input() class: string = '';
    @HostBinding('class')
    get columnClass() {
        return hlm('z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md', this.class);
    }
}

@Directive({
    selector: '[hlmMenuItem]',
    standalone: true,
})
export class HlmMenuItemDirective {
    @Input() class: string = '';
    @HostBinding('class')
    get columnClass() {
        return hlm(
            'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            this.class
        );
    }
}

@Directive({
    selector: '[hlmMenuSeparator]',
    standalone: true,
})
export class HlmMenuSeparatorDirective {
    @Input() class: string = '';
    @HostBinding('class')
    get columnClass() {
        return hlm('-mx-1 my-1 h-px bg-muted', this.class);
    }
}

@Directive({
    selector: '[hlmMenuLabel]',
    standalone: true,
})
export class HlmMenuLabelDirective {
    @Input() class: string = '';
    @HostBinding('class')
    get columnClass() {
        return hlm('px-2 py-1.5 text-sm font-semibold', this.class);
    }
}
