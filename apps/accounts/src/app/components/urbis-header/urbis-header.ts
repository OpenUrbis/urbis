import { Component, computed, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  HlmButtonDirective,
  HlmIconComponent,
  HlmMenuDirective,
  HlmMenuItemDirective,
  HlmMenuSeparatorDirective,
  HlmSidebarTriggerDirective,
} from '../../../../projects/shared/src/public-api';
import { provideIcons } from '@ng-icons/core';
import { lucideLogOut, lucideMenu, lucideUser, lucideX } from '@ng-icons/lucide';
import { LogoComponent } from '../../../../projects/shared/src/lib/components/logo/logo.component';
import { UrbisAccessibilityMenu } from './accessibility-menu/urbis-accessibility-menu';
import { ProfileState } from '../../states/profile/profile.state';
import { AuthState } from '../../states/auth/auth.state';
import { WhitelabelState } from '../../states/whitelabel/whitelabel.state';
import { OrganizationState } from '../../states/organization/organization.state';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { AUTH_CONFIG_ID } from '../../../../projects/shared/src/lib/auth/auth.config';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserAvatarComponent } from '../user-avatar/user-avatar';

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

@Component({
  selector: 'app-urbis-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HlmButtonDirective,
    HlmIconComponent,
    HlmMenuDirective,
    HlmMenuItemDirective,
    HlmMenuSeparatorDirective,
    HlmSidebarTriggerDirective,
    LogoComponent,
    UrbisAccessibilityMenu,
    UserAvatarComponent,
  ],
  providers: [provideIcons({ lucideMenu, lucideX, lucideUser, lucideLogOut })],
  template: `
    <header class="sticky top-0 z-[1000] h-16 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="flex h-full items-center px-4 w-full">
        
        <div class="flex items-center gap-4">
          <!-- Sidebar Toggle -->
          <button
            *ngIf="showMobileMenu"
            hlmSidebarTrigger
            hlmBtn
            variant="ghost"
            size="icon"
            class="h-9 w-9 rounded-md hidden md:inline-flex"
            aria-label="Toggle Navigation"
          >
            <hlm-icon name="lucideMenu" size="18" />
          </button>

          <!-- Logo -->
          <div class="flex items-center">
            <a [href]="logoHref" class="flex items-center gap-2 no-underline transition-opacity hover:opacity-90">
              <img 
                *ngIf="logoSrc"
                [src]="logoSrc" 
                [alt]="logoAlt" 
                class="h-8 w-auto object-contain"
              />
              <lib-logo *ngIf="!logoSrc" width="100px" [variant]="isDarkMode() ? 'alt' : 'default'" />
              <span *ngIf="badgeText" class="hidden text-xs font-bold text-muted-foreground opacity-70 sm:inline-block">{{ badgeText }}</span>
            </a>
          </div>

          <!-- Desktop Menu -->
          <nav class="hidden items-center gap-1 md:flex">
            <a *ngFor="let item of menuItems" 
               [href]="item.href"
               class="flex h-8 items-center justify-center rounded-full border px-3 text-sm font-medium transition-all"
               [ngClass]="item.active ? 
                 'border-primary bg-primary/10 text-primary font-semibold' : 
                 'border-border bg-transparent text-foreground hover:border-secondary hover:bg-secondary hover:text-secondary-foreground hover:shadow-sm'"
            >
              {{ item.label }}
            </a>
          </nav>
        </div>

        <div class="flex flex-1 items-center justify-end gap-2">
          
          <!-- Accessibility & Settings -->
          <app-urbis-accessibility-menu />
          
          <!-- User Menu -->
          <ng-container *ngIf="authState.isAuthenticated(); else loginBtn">
            <div class="relative">
              <button
                hlmBtn
                variant="outline"
                size="sm"
                (click)="userMenuOpen = !userMenuOpen"
                class="h-9 gap-2 rounded-full border-border bg-background px-2 transition-colors hover:bg-red hover:text-accent-foreground"
              >
                <div class="flex items-center gap-2">
                  <app-user-avatar 
                    [src]="avatarSrc()" 
                    [firstName]="getFirstName()" 
                    [lastName]="getLastName()" 
                    [width]="28" 
                    [height]="28" 
                  />
                  <span class="hidden text-sm font-medium sm:inline-block">
                    {{ getUserName() }}
                  </span>
                </div>
              </button>

              <div *ngIf="userMenuOpen" hlmMenu class="absolute right-0 top-full mt-2 w-56">
                <div class="flex items-center gap-3 px-3 py-2 border-b border-border">
                  <app-user-avatar 
                    [src]="avatarSrc()" 
                    [firstName]="getFirstName()" 
                    [lastName]="getLastName()" 
                    [width]="40" 
                    [height]="40" 
                  />
                  <div class="flex flex-col truncate">
                    <span class="text-sm font-semibold truncate">{{ getFullUserName() }}</span>
                    <span class="text-xs text-muted-foreground truncate" *ngIf="profileState.value() as user">{{ user.email }}</span>
                  </div>
                </div>
                
                <div class="p-1">
                  <button hlmMenuItem routerLink="/profile" class="w-full gap-2">
                    <hlm-icon name="lucideUser" size="16" />
                    <span>Perfil</span>
                  </button>
                </div>
                
                <div hlmMenuSeparator></div>
                
                <div class="p-1">
                  <button hlmMenuItem (click)="onLogout()" class="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <hlm-icon name="lucideLogOut" size="16" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-template #loginBtn>
            <button *ngIf="showLogin" hlmBtn variant="outline" class="rounded-full border-primary text-primary hover:bg-primary/5" (click)="onLogin()">
              Entrar
            </button>
          </ng-template>

          <!-- Mobile Menu Trigger -->
          <button *ngIf="showMobileMenu" hlmBtn variant="ghost" size="icon" class="md:hidden" (click)="mobileMenuOpen = !mobileMenuOpen">
            <hlm-icon [name]="mobileMenuOpen ? 'lucideX' : 'lucideMenu'" />
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Drawer Overlay -->
    <div *ngIf="mobileMenuOpen" 
          class="fixed inset-0 z-[1040] bg-background/80 backdrop-blur-sm md:hidden"
          (click)="mobileMenuOpen = false">
    </div>

    <!-- Mobile Drawer -->
    <div class="fixed top-0 bottom-0 right-0 z-[1050] w-full max-w-[300px] bg-background shadow-xl transition-transform duration-300 md:hidden"
          [class.translate-x-0]="mobileMenuOpen"
          [class.translate-x-full]="!mobileMenuOpen">
      
      <div class="flex items-center justify-between border-b border-border px-4 py-3">
          <span class="text-lg font-bold">Menu</span>
          <button hlmBtn variant="ghost" size="icon" (click)="mobileMenuOpen = false">
            <hlm-icon name="lucideX" />
          </button>
      </div>
      
      <div class="flex flex-col gap-0 p-4">
          <a *ngFor="let item of menuItems" 
            [href]="item.href"
            (click)="mobileMenuOpen = false"
            class="flex items-center rounded-md px-3 py-2 text-base font-medium transition-colors"
            [ngClass]="item.active ? 
              'bg-primary/10 text-primary font-semibold' : 
              'text-foreground hover:bg-accent hover:text-accent-foreground'">
            {{ item.label }}
          </a>
      </div>
    </div>
  `,
})
export class UrbisHeader {
  profileState = inject(ProfileState);
  authState = inject(AuthState);
  private whitelabel = inject(WhitelabelState);
  private organizationState = inject(OrganizationState);
  private oidcSecurityService = inject(OidcSecurityService);

  @Input() logoHref = '/';
  @Input() logoSrc: string | undefined;
  @Input() logoAlt = 'Logo';
  @Input() badgeText = 'CONTA';
  @Input() menuItems: NavItem[] = [];
  @Input() showLogin = true;
  @Input() showMobileMenu = true;

  mobileMenuOpen = false;
  userMenuOpen = false;

  readonly avatarSrc = computed(() => {
    const profile = this.profileState.value();
    if (!profile?.id) return undefined;
    return `${environment.s3EndpointPublic}/avatars/${profile.id}`;
  });

  isDarkMode = computed(() => {
    const val = this.whitelabel.value();
    return (val as any)?.theme === 'dark';
  });

  getFirstName(): string {
    return this.profileState.value()?.firstName || 'U';
  }

  getLastName(): string {
    return this.profileState.value()?.lastName || '';
  }

  onLogin() {
    window.location.href = '/sign-in';
  }

  async onLogout() {
    this.organizationState.clearSelectedOrganization();
    await firstValueFrom(this.oidcSecurityService.logoff(AUTH_CONFIG_ID));
  }

  getUserInitials(): string {
    const user = this.profileState.value();
    if (!user) return 'U';
    const name = user.firstName || user.email || 'U';
    return name[0].toUpperCase();
  }

  getUserName(): string {
    const user = this.profileState.value();
    if (!user) return 'Usuário';
    return user.firstName || (user.email ? user.email.split('@')[0] : 'Usuário');
  }

  getFullUserName(): string {
    const user = this.profileState.value();
    if (!user) return 'Usuário';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || 'Usuário';
  }
}
