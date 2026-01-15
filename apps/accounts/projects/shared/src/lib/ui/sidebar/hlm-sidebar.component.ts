import { Component, Directive, HostBinding, HostListener, Input, inject, computed } from '@angular/core';
import { hlm } from '../hlm/utils';
import { HlmSidebarService } from './hlm-sidebar.service';
import { CommonModule } from '@angular/common';

@Directive({
    selector: '[hlmSidebarWrapper]',
    standalone: true,
})
export class HlmSidebarWrapperDirective {
    @HostBinding('class')
    get columnClass() {
        return hlm('flex h-[calc(100vh-64px)] w-full');
    }
}

@Component({
    selector: 'hlm-sidebar',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- Mobile overlay -->
    <div 
      *ngIf="isMobile() && openMobile()"
      class="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
      (click)="closeMobile()"
    ></div>

    <!-- Sidebar -->
    <aside
      class="group/sidebar relative flex h-full flex-col bg-background text-sidebar-foreground transition-all duration-300 ease-in-out border-r border-sidebar-border z-40"
      [class.shadow-xl]="isMobile()"
      [class.w-64]="isMobile() || (!isMobile() && state() === 'expanded')"
      [class.w-16]="!isMobile() && state() === 'collapsed'"
      [class.fixed]="isMobile()"
      [class.inset-y-0]="isMobile()"
      [class.left-0]="isMobile()"
      [class.-translate-x-full]="isMobile() && !openMobile()"
      [class.translate-x-0]="isMobile() && openMobile()"
    >
      <ng-content />
    </aside>
  `,
})
export class HlmSidebarComponent {
    @HostBinding('class')
    get _class() {
        if (this.isMobile()) {
            return this.openMobile() ? 'flex flex-col h-full w-0' : 'hidden';
        }
        return 'flex flex-col h-full w-auto';
    }

    private sidebarService = inject(HlmSidebarService);
    state = this.sidebarService.state;
    isMobile = this.sidebarService.isMobile;
    openMobile = this.sidebarService.openMobile;

    closeMobile() {
        this.sidebarService.setOpenMobile(false);
    }
}

@Directive({
    selector: '[hlmSidebarHeader]',
    standalone: true,
})
export class HlmSidebarHeaderDirective {
    @HostBinding('class')
    get columnClass() {
        return hlm('flex flex-col p-4 shrink-0');
    }
}

@Directive({
    selector: '[hlmSidebarContent]',
    standalone: true,
})
export class HlmSidebarContentDirective {
    @HostBinding('class')
    get columnClass() {
        return hlm('flex flex-1 flex-col overflow-y-auto overflow-x-hidden');
    }
}

@Directive({
    selector: '[hlmSidebarFooter]',
    standalone: true,
})
export class HlmSidebarFooterDirective {
    @HostBinding('class')
    get columnClass() {
        return hlm('flex flex-col p-4 shrink-0');
    }
}

@Directive({
    selector: '[hlmSidebarGroup]',
    standalone: true,
})
export class HlmSidebarGroupDirective {
    @HostBinding('class')
    get columnClass() {
        return hlm('relative flex w-full min-w-0 flex-col p-2');
    }
}

@Directive({
    selector: '[hlmSidebarMenu]',
    standalone: true,
})
export class HlmSidebarMenuDirective {
    @HostBinding('class')
    get columnClass() {
        return hlm('flex w-full min-w-0 flex-col gap-1');
    }
}

@Directive({
    selector: '[hlmSidebarMenuButton]',
    standalone: true,
})
export class HlmSidebarMenuButtonDirective {
    private sidebarService = inject(HlmSidebarService);
    state = this.sidebarService.state;

    @Input() variant: 'default' | 'outline' = 'default';

    @HostBinding('class')
    get columnClass() {
        return hlm(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground no-underline text-foreground cursor-pointer border-none bg-transparent text-left',
            this.state() === 'collapsed' ? 'justify-center' : 'justify-start',
            this.variant === 'outline' ? 'border border-input bg-background' : ''
        );
    }
}

@Directive({
    selector: '[hlmSidebarTrigger]',
    standalone: true,
})
export class HlmSidebarTriggerDirective {
    private sidebarService = inject(HlmSidebarService);

    @HostBinding('class')
    get columnClass() {
        return hlm('inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer');
    }

    @HostBinding('attr.aria-label')
    ariaLabel = 'Toggle Sidebar';

    @HostListener('click')
    toggle() {
        console.log('Sidebar trigger clicked!'); // Debug log
        this.sidebarService.toggleSidebar();
    }
}
