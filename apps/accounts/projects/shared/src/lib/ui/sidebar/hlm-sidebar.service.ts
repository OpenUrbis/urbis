import { Injectable, computed, signal, effect } from '@angular/core';

export type SidebarState = 'expanded' | 'collapsed';

@Injectable({
    providedIn: 'root',
})
export class HlmSidebarService {
    private readonly _state = signal<SidebarState>('expanded');
    private readonly _isMobile = signal<boolean>(false);
    private readonly _openMobile = signal<boolean>(false);

    readonly state = computed(() => this._state());
    readonly isMobile = computed(() => this._isMobile());
    readonly openMobile = computed(() => this._openMobile());

    constructor() {
        this._checkMobile();
        window.addEventListener('resize', () => this._checkMobile());

        // Simple keyboard shortcut: Cmd+B or Ctrl+B
        window.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                this.toggleSidebar();
            }
        });

        // Sync state with local storage for persistence (simple version)
        const saved = localStorage.getItem('hlm-sidebar-state');
        if (saved === 'collapsed') {
            this._state.set('collapsed');
        }
    }

    private _checkMobile() {
        this._isMobile.set(window.innerWidth < 768);
    }

    toggleSidebar() {
        if (this._isMobile()) {
            this._openMobile.set(!this._openMobile());
        } else {
            const newState = this._state() === 'expanded' ? 'collapsed' : 'expanded';
            this._state.set(newState);
            localStorage.setItem('hlm-sidebar-state', newState);
        }
    }

    setOpen(open: boolean) {
        this._state.set(open ? 'expanded' : 'collapsed');
        localStorage.setItem('hlm-sidebar-state', this._state());
    }

    setOpenMobile(open: boolean) {
        this._openMobile.set(open);
    }
}
