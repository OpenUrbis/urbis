import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  HlmCardDirective,
  HlmCardContentDirective,
  HlmIconComponent,
} from '../../../../../../projects/shared/src/public-api';
import { provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideShieldCheck,
  lucideCheckCircle2,
  lucideInfo,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-usage-limit',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmIconComponent,
  ],
  providers: [
    provideIcons({
      lucideActivity,
      lucideShieldCheck,
      lucideCheckCircle2,
      lucideInfo,
    }),
  ],
  template: `
    <div class="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div hlmCard class="overflow-hidden shadow-md">
        <!-- Header -->
        <div
          class="flex items-center gap-4 p-6 border-b border-border bg-muted/10"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <hlm-icon name="lucideActivity" size="20" />
          </div>
          <div>
            <h3 class="text-2xl font-semibold tracking-tight">
              Limite de Uso e Cotas
            </h3>
            <p class="text-sm text-muted-foreground mt-1">
              Consulte as cotas e limites diários de requisições de mapas do
              Urbis para a sua conta e entidade.
            </p>
          </div>
        </div>

        <!-- Content Area -->
        <div hlmCardContent class="p-6">
          <!-- Loading State -->
          <div
            *ngIf="usageResource.isLoading()"
            class="flex flex-col items-center justify-center py-12 space-y-3"
          >
            <div
              class="animate-spin h-8 w-8 text-primary border-t-2 border-primary rounded-full"
            ></div>
            <p class="text-sm text-muted-foreground italic">
              Carregando informações de uso...
            </p>
          </div>

          <!-- Error State -->
          <div
            *ngIf="usageResource.error()"
            class="flex flex-col items-center justify-center py-12 text-center space-y-3"
          >
            <span class="text-destructive text-3xl">⚠️</span>
            <p class="text-sm text-destructive font-semibold">
              Erro ao carregar as informações do limite de uso.
            </p>
          </div>

          <!-- Normal Content -->
          <div *ngIf="usageResource.value() as data" class="space-y-6">
            <!-- Cards Grid -->
            <div class="grid gap-4 md:grid-cols-3">
              <!-- Uso Diário -->
              <div
                class="rounded-xl border border-border bg-muted/30 p-5 space-y-1 shadow-sm relative overflow-hidden group"
              >
                <hlm-icon
                  name="lucideActivity"
                  size="44"
                  class="absolute right-2 -bottom-2 text-primary/5 group-hover:scale-110 transition-transform"
                />
                <div
                  class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Uso Diário
                </div>
                <div class="flex items-baseline gap-1 pt-2">
                  <span
                    class="text-3xl font-bold tracking-tight text-foreground"
                    >{{ data.currentUsage }}</span
                  >
                  <span class="text-xs text-muted-foreground font-medium"
                    >reqs</span
                  >
                </div>
                <p class="text-[10px] text-muted-foreground pt-1">
                  Total consumido hoje.
                </p>
              </div>

              <!-- Limite Diário -->
              <div
                class="rounded-xl border border-border bg-muted/30 p-5 space-y-1 shadow-sm relative overflow-hidden group"
              >
                <hlm-icon
                  name="lucideShieldCheck"
                  size="44"
                  class="absolute right-2 -bottom-2 text-primary/5 group-hover:scale-110 transition-transform"
                />
                <div
                  class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Limite Diário
                </div>
                <div class="flex items-baseline gap-1 pt-2">
                  <span
                    class="text-3xl font-bold tracking-tight text-foreground"
                    >{{ data.dailyLimit }}</span
                  >
                  <span class="text-xs text-muted-foreground font-medium"
                    >reqs</span
                  >
                </div>
                <p class="text-[10px] text-muted-foreground pt-1">
                  Sua cota dedicada ativa.
                </p>
              </div>

              <!-- Restante -->
              <div
                class="rounded-xl border border-border bg-muted/30 p-5 space-y-1 shadow-sm relative overflow-hidden group"
              >
                <hlm-icon
                  name="lucideCheckCircle2"
                  size="44"
                  class="absolute right-2 -bottom-2 text-emerald-500/5 group-hover:scale-110 transition-transform"
                />
                <div
                  class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Disponível
                </div>
                <div class="flex items-baseline gap-1 pt-2">
                  <span
                    class="text-3xl font-bold tracking-tight"
                    [ngClass]="getRemainingColorClass(data)"
                    >{{ data.remaining }}</span
                  >
                  <span class="text-xs text-muted-foreground font-medium"
                    >reqs</span
                  >
                </div>
                <p class="text-[10px] text-muted-foreground pt-1">
                  Saldo de requisições hoje.
                </p>
              </div>
            </div>

            <!-- Dynamic Progress Bar -->
            <div class="space-y-2 pt-2">
              <div class="flex justify-between text-xs font-semibold">
                <span class="text-muted-foreground">Consumo Geral da Cota</span>
                <span [ngClass]="getRemainingColorClass(data)"
                  >{{ getPercentage(data) | number: '1.0-1' }}%</span
                >
              </div>
              <div
                class="h-3 w-full bg-muted rounded-full overflow-hidden border border-border/10 shadow-inner"
              >
                <div
                  class="h-full rounded-full transition-all duration-500 ease-out"
                  [ngClass]="getProgressBarColorClass(data)"
                  [style.width.%]="getPercentage(data)"
                ></div>
              </div>
            </div>

            <!-- Notice Information Block -->
            <div
              class="rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-5 text-xs space-y-3 leading-relaxed"
            >
              <div class="flex items-center gap-2 font-bold text-sm">
                <hlm-icon name="lucideInfo" size="16" />
                <span>Como funciona o seu Limite Unificado?</span>
              </div>
              <p>
                Para garantir o controle e evitar bloqueios desnecessários, o
                Urbis **unifica** todas as cotas de consumo do seu usuário e
                entidade sob uma única cota diária de
                <strong>{{ data.dailyLimit }} requisições</strong>. Esta cota é
                compartilhada entre:
              </p>
              <div class="grid gap-3 sm:grid-cols-2 pt-1">
                <div
                  class="border-l-2 border-blue-500/40 pl-3 py-1 space-y-0.5"
                >
                  <span class="font-bold text-foreground block"
                    >Sessão Web (Access Token)</span
                  >
                  <span class="text-muted-foreground"
                    >Suas consultas, buscas e navegação normal de mapas no
                    cliente oficial do Urbis.</span
                  >
                </div>
                <div
                  class="border-l-2 border-blue-500/40 pl-3 py-1 space-y-0.5"
                >
                  <span class="font-bold text-foreground block"
                    >Chaves de API Pessoais</span
                  >
                  <span class="text-muted-foreground"
                    >Requisições externas diretas de robôs, scripts ou softwares
                    SIG (como QGIS e ArcGIS) utilizando suas chaves.</span
                  >
                </div>
              </div>
              <p class="pt-2 border-t border-blue-500/15 font-medium">
                Nota: O limite diário de requisições é zerado automaticamente
                todos os dias às 00:00 (horário de Brasília).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UsageLimit {
  private http = inject(HttpClient);

  usageResource = rxResource({
    stream: () => this.http.get<any>(`${environment.api}/user/me/usage`),
  });

  getUsageData(value: any): any {
    return value;
  }

  getPercentage(value: any): number {
    const data = this.getUsageData(value);
    if (!data || !data.dailyLimit) return 0;
    return Math.min((data.currentUsage / data.dailyLimit) * 100, 100);
  }

  getProgressBarColorClass(value: any): string {
    const percentage = this.getPercentage(value);
    if (percentage > 90) return 'bg-destructive';
    if (percentage > 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  getRemainingColorClass(value: any): string {
    const percentage = this.getPercentage(value);
    if (percentage > 90) return 'text-destructive';
    if (percentage > 70) return 'text-amber-500 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-500';
  }
}
