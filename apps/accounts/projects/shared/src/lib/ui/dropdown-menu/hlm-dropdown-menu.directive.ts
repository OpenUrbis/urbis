import { Directive, HostBinding, Input, TemplateRef, inject } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { hlm } from '../hlm/utils';

@Directive({
    selector: '[hlmDropdownMenuTrigger]',
    standalone: true,
    hostDirectives: [CdkMenuTrigger],
})
export class HlmDropdownMenuTriggerDirective {
    private _cdkMenuTrigger = inject(CdkMenuTrigger);

    @Input()
    set hlmDropdownMenuTrigger(value: TemplateRef<unknown>) {
        this._cdkMenuTrigger.menuTemplateRef = value;
    }
}

@Directive({
    selector: 'hlm-dropdown-menu, [hlmDropdownMenu]',
    standalone: true,
    hostDirectives: [CdkMenu],
})
export class HlmDropdownMenuDirective {
    @HostBinding('class')
    get classes() {
        return hlm(
            'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
        );
    }
}

@Directive({
    selector: '[hlmDropdownMenuItem]',
    standalone: true,
    hostDirectives: [CdkMenuItem],
})
export class HlmDropdownMenuItemDirective {
    @HostBinding('class')
    get classes() {
        return hlm(
            'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
            'transition-colors focus:bg-accent focus:text-accent-foreground',
            'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
        );
    }
}

@Directive({
    selector: 'hlm-dropdown-menu-separator',
    standalone: true,
})
export class HlmDropdownMenuSeparatorDirective {
    @HostBinding('class')
    get classes() {
        return hlm('-mx-1 my-1 h-px bg-muted');
    }
}

@Directive({
    selector: 'hlm-dropdown-menu-label',
    standalone: true,
})
export class HlmDropdownMenuLabelDirective {
    @HostBinding('class')
    get classes() {
        return hlm('px-2 py-1.5 text-sm font-semibold');
    }
}

@Directive({
    selector: 'hlm-dropdown-menu-group',
    standalone: true,
})
export class HlmDropdownMenuGroupDirective {
    @HostBinding('class')
    get classes() {
        return hlm('');
    }
}
