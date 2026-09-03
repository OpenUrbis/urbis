import { Component, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import {
  HlmToasterService,
  HlmCardDirective,
  HlmCardContentDirective,
  HlmIconComponent,
} from '../../../../../../projects/shared/src/public-api';
import { provideIcons } from '@ng-icons/core';
import {
  lucideKey,
  lucideCopy,
  lucideCheck,
  lucideTrash,
  lucideAlertTriangle,
  lucideTerminal,
  lucideBuilding2,
} from '@ng-icons/lucide';
import { OrganizationState } from '../../../../states/organization/organization.state';

@Component({
  selector: 'app-api-keys',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmIconComponent,
  ],
  providers: [
    provideIcons({
      lucideKey,
      lucideCopy,
      lucideCheck,
      lucideTrash,
      lucideAlertTriangle,
      lucideTerminal,
      lucideBuilding2,
    }),
  ],
  template: `
    <div class="max-w-4xl mx-auto p-4 md:p-6 space-y-6 font-sans">
      <!-- Title Header (Google Console Style) -->
      <div class="pb-5 border-b border-border/80">
        <h1
          class="text-2xl font-normal tracking-tight text-foreground flex items-center gap-2"
        >
          <hlm-icon
            name="lucideKey"
            class="text-blue-600 dark:text-blue-400"
            size="22"
          />
          Chaves de API pessoais
        </h1>
        <p
          class="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-2xl"
        >
          As chaves de API pessoais permitem que você realize consultas e
          integrações de mapas de forma direta e programática. Mantenha suas
          chaves seguras e nunca as compartilhe.
        </p>
      </div>

      <!-- Entity Selector & Layout Grid -->
      <div class="grid gap-6">
        <!-- Filter Bar / Selector -->
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-muted/20 border border-border/50 rounded-lg gap-4"
        >
          <div class="flex items-center gap-2">
            <hlm-icon
              name="lucideBuilding2"
              class="text-muted-foreground"
              size="16"
            />
            <span class="text-xs font-medium text-foreground"
              >Entidade ativa para gerenciamento:</span
            >
          </div>
          <select
            [value]="selectedOrgId()"
            (change)="onOrganizationChange($any($event.target).value)"
            class="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-semibold max-w-xs focus:ring-ring focus:outline-none w-full sm:w-auto shadow-sm"
          >
            <ng-container
              *ngFor="let org of organizationState.value().myOrganizations"
            >
              <option
                *ngIf="org.name && !org.name.toLowerCase().includes('codata')"
                [value]="org.id"
              >
                {{ org.name }}
              </option>
            </ng-container>
          </select>
        </div>

        <!-- Credentials Card -->
        <div
          hlmCard
          class="border border-border/70 rounded-lg shadow-sm bg-card overflow-hidden"
        >
          <div hlmCardContent class="p-6 space-y-6">
            <!-- Create Key Form (Minimalist Google Style) -->
            <div class="space-y-4">
              <h2
                class="text-sm font-medium text-foreground flex items-center gap-2"
              >
                Criar nova chave de acesso para:
                <span class="text-blue-600 dark:text-blue-400 font-semibold">{{
                  getSelectedOrgName()
                }}</span>
              </h2>
              <div class="flex flex-col sm:flex-row gap-3 max-w-xl">
                <input
                  type="text"
                  [(ngModel)]="newKeyName"
                  placeholder="Nome da chave (ex: Integração QGIS)"
                  class="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
                />
                <button
                  (click)="generateKey()"
                  [disabled]="submitting() || !newKeyName"
                  class="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 px-4 py-2 text-xs font-medium rounded-md shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  Criar chave
                </button>
              </div>
            </div>

            <!-- Single Copy Notice Banner (SHOW ONCE) -->
            <div
              *ngIf="newlyCreatedKey()"
              class="p-4 rounded-md bg-amber-500/5 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs space-y-3 leading-relaxed"
            >
              <div
                class="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400"
              >
                <hlm-icon name="lucideAlertTriangle" size="14" />
                <span>Importante: copie sua chave de API agora!</span>
              </div>
              <p class="text-muted-foreground">
                Por motivos de segurança, nós não salvamos a chave em texto puro
                no servidor. Você não conseguirá visualizá-la novamente.
              </p>

              <div class="space-y-2">
                <!-- Key -->
                <div class="space-y-1">
                  <span
                    class="text-[10px] text-muted-foreground block font-medium"
                    >Chave de API pessoal (x-api-key)</span
                  >
                  <div
                    class="flex items-center gap-2 bg-background p-2 rounded border border-border"
                  >
                    <code
                      class="font-mono text-xs break-all flex-1 text-foreground selection:bg-blue-500/10"
                      >{{ newlyCreatedKey() }}</code
                    >
                    <button
                      (click)="copyToClipboard(newlyCreatedKey() || '')"
                      class="text-[11px] font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:bg-blue-500/5 px-2 py-1 rounded shrink-0 flex items-center gap-1"
                    >
                      <hlm-icon name="lucideCopy" size="12" />
                      Copiar
                    </button>
                  </div>
                </div>

                <!-- Org ID -->
                <div class="space-y-1 pt-2 border-t border-amber-500/10">
                  <p class="text-[10px] text-muted-foreground font-medium">
                    ID da organização correspondente (x-organization-id):
                  </p>
                  <div
                    class="flex items-center gap-2 bg-background p-2 rounded border border-border"
                  >
                    <code
                      class="font-mono text-xs break-all flex-1 text-foreground selection:bg-blue-500/10"
                      >{{ selectedOrgId() }}</code
                    >
                    <button
                      (click)="copyToClipboard(selectedOrgId())"
                      class="text-[11px] font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:bg-blue-500/5 px-2 py-1 rounded shrink-0 flex items-center gap-1"
                    >
                      <hlm-icon name="lucideCopy" size="12" />
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            <div
              *ngIf="keysResource.isLoading()"
              class="flex flex-col items-center justify-center py-10 space-y-2"
            >
              <div
                class="animate-spin h-6 w-6 text-blue-600 border-t-2 border-blue-600 rounded-full"
              ></div>
              <p class="text-xs text-muted-foreground italic">
                Carregando chaves...
              </p>
            </div>

            <!-- Error State -->
            <div
              *ngIf="keysResource.error()"
              class="flex flex-col items-center justify-center py-10 text-center space-y-2"
            >
              <span class="text-destructive text-2xl">⚠️</span>
              <p class="text-xs text-destructive font-medium">
                Erro ao carregar as chaves de API.
              </p>
            </div>

            <!-- Keys Table / List (Google Console Table Style) -->
            <div *ngIf="keysResource.value() as keys" class="space-y-4 pt-2">
              <div
                class="flex items-center justify-between border-b border-border/60 pb-2"
              >
                <h3
                  class="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  Chaves ativas ({{ getSelectedOrgName() }})
                </h3>
                <span class="text-xs text-muted-foreground font-medium"
                  >Total: {{ keys.length }}</span
                >
              </div>

              <div
                *ngIf="keys.length === 0"
                class="text-center py-12 border border-dashed rounded-lg text-xs text-muted-foreground italic"
              >
                Nenhuma chave de API ativa para esta entidade.
              </div>

              <!-- List / Table -->
              <div
                *ngIf="keys.length > 0"
                class="border rounded-md overflow-hidden bg-background divide-y divide-border"
              >
                <div
                  *ngFor="let key of keys"
                  class="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/5 transition-colors"
                >
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold text-foreground">{{
                        key.name
                      }}</span>
                      <code
                        class="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                        >{{ key.prefix }}</code
                      >
                    </div>
                    <p class="text-[10px] text-muted-foreground leading-none">
                      Criada em: {{ key.createdAt | date: 'shortDate' }}
                      <span class="mx-1">•</span>
                      Último uso:
                      {{
                        key.lastUsedAt
                          ? (key.lastUsedAt | date: 'short')
                          : 'Nunca'
                      }}
                    </p>
                  </div>
                  <button
                    (click)="revokeKey(key.id)"
                    class="text-[11px] font-medium border border-destructive/20 text-destructive hover:bg-destructive/10 px-2.5 py-1.5 rounded transition-colors self-start sm:self-center flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <hlm-icon name="lucideTrash" size="12" />
                    Revogar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Google-style Usage Examples Panel -->
        <div
          hlmCard
          class="border border-border/70 rounded-lg shadow-sm bg-card overflow-hidden"
        >
          <!-- Tab headers with thin bottom line -->
          <div
            class="border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 bg-muted/5 gap-2"
          >
            <div class="flex items-center gap-2 py-3">
              <hlm-icon
                name="lucideTerminal"
                size="16"
                class="text-blue-600 dark:text-blue-400"
              />
              <h3 class="text-sm font-medium text-foreground">
                Como utilizar suas chaves
              </h3>
            </div>
            <div class="flex border-b border-transparent">
              <button
                (click)="activeExampleTab.set('curl')"
                [class.border-blue-600]="activeExampleTab() === 'curl'"
                [class.text-blue-600]="activeExampleTab() === 'curl'"
                class="px-4 py-3 text-xs font-semibold border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                cURL (Terminal)
              </button>
              <button
                (click)="activeExampleTab.set('qgis')"
                [class.border-blue-600]="activeExampleTab() === 'qgis'"
                [class.text-blue-600]="activeExampleTab() === 'qgis'"
                class="px-4 py-3 text-xs font-semibold border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                QGIS (SIG)
              </button>
            </div>
          </div>

          <div hlmCardContent class="p-6 space-y-4">
            <p class="text-xs text-muted-foreground leading-relaxed">
              Consuma as camadas de geoprocessamento do Urbis diretamente em
              softwares de geoprocessamento (SIG) ou via requisições HTTP
              utilizando o protocolo padrão
              <strong>WFS (Web Feature Service)</strong>.
            </p>

            <!-- cURL TAB -->
            <div *ngIf="activeExampleTab() === 'curl'" class="space-y-4">
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                Envie a sua chave de API ativa no cabeçalho
                <code>x-api-key</code> e o ID da organização no cabeçalho
                <code>x-organization-id</code> para obter feições geográficas em
                formato GeoJSON.
              </p>
              <div class="space-y-1.5">
                <span
                  class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide"
                  >Comando cURL (WFS GetFeature)</span
                >
                <div
                  class="relative bg-muted p-4 rounded-lg border overflow-auto group"
                >
                  <pre
                    class="text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground select-all"
                    >{{ getWfsCurlExample() }}</pre
                  >
                  <button
                    (click)="copyToClipboard(getWfsCurlExample())"
                    class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] bg-background/90 hover:bg-background border border-border px-2 py-1 rounded shrink-0 flex items-center gap-1 shadow-sm font-semibold"
                  >
                    <hlm-icon name="lucideCopy" size="12" />
                    Copiar
                  </button>
                </div>
              </div>
            </div>

            <!-- QGIS TAB -->
            <div *ngIf="activeExampleTab() === 'qgis'" class="space-y-4">
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                Para carregar as camadas diretamente no QGIS como conexões de
                mapa integradas:
              </p>
              <div class="border rounded-lg p-4 bg-muted/10 space-y-3 text-xs">
                <ol
                  class="list-decimal list-inside space-y-2 text-muted-foreground leading-relaxed"
                >
                  <li>
                    No painel lateral do QGIS, clique com o botão direito em
                    <strong>WFS / OGC API Features</strong> (ou
                    <strong>WMS/WMTS</strong>) e selecione
                    <strong>Nova Conexão...</strong>.
                  </li>
                  <li>
                    Preencha os campos utilizando as configurações abaixo:
                  </li>
                </ol>

                <div
                  class="border rounded-md bg-background overflow-hidden divide-y text-xs font-mono"
                >
                  <div class="p-2.5 flex justify-between gap-4">
                    <span class="text-muted-foreground shrink-0 font-medium"
                      >Nome:</span
                    >
                    <span class="text-foreground font-semibold"
                      >Urbis Geoprocessamento</span
                    >
                  </div>
                  <div class="p-2.5 flex justify-between gap-4">
                    <span class="text-muted-foreground shrink-0 font-medium"
                      >Conexão WFS (Vetores):</span
                    >
                    <span
                      class="text-blue-600 break-all select-all font-semibold"
                      >{{ apiEndpoint }}/maps/proxy/wfs</span
                    >
                  </div>
                  <div class="p-2.5 flex justify-between gap-4">
                    <span class="text-muted-foreground shrink-0 font-medium"
                      >Conexão WMS (Imagens):</span
                    >
                    <span
                      class="text-blue-600 break-all select-all font-semibold"
                      >{{ apiEndpoint }}/maps/proxy/wms</span
                    >
                  </div>
                  <div class="p-2.5 flex justify-between gap-4">
                    <span class="text-muted-foreground shrink-0 font-medium"
                      >Entidade ativa:</span
                    >
                    <span class="text-foreground font-semibold">{{
                      getSelectedOrgName()
                    }}</span>
                  </div>
                </div>

                <ol
                  start="3"
                  class="list-decimal list-inside space-y-2 text-muted-foreground leading-relaxed"
                >
                  <li>
                    Abra as configurações de
                    <strong>Cabeçalhos HTTP Adicionais</strong> (HTTP Headers)
                    na conexão do QGIS.
                  </li>
                  <li>
                    Adicione as seguintes chaves e valores como cabeçalhos
                    personalizados de autenticação:
                  </li>
                </ol>

                <div
                  class="border rounded-md bg-background overflow-hidden divide-y text-xs font-mono"
                >
                  <div class="p-2.5 flex items-center justify-between gap-4">
                    <span class="text-primary font-bold shrink-0"
                      >x-api-key</span
                    >
                    <span
                      class="text-foreground truncate select-all font-semibold"
                      >{{
                        newlyCreatedKey() || 'SUA_CHAVE_DE_API_GERADA'
                      }}</span
                    >
                  </div>
                  <div class="p-2.5 flex items-center justify-between gap-4">
                    <span class="text-primary font-bold shrink-0"
                      >x-organization-id</span
                    >
                    <span class="text-foreground select-all font-semibold">{{
                      selectedOrgId()
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Helpful note -->
            <div
              class="rounded bg-blue-500/5 text-blue-700 dark:text-blue-300 p-4 text-[11px] leading-relaxed"
            >
              <strong>Nota de cota:</strong> os limites de cota diária de
              consumo são computados de forma idêntica tanto para o uso de cURL
              quanto para conexões do QGIS. Evite compartilhar suas chaves para
              prevenir bloqueios de cota.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ApiKeysComponent {
  private http = inject(HttpClient);
  private toaster = inject(HlmToasterService);
  organizationState = inject(OrganizationState);

  newKeyName = '';
  submitting = signal(false);
  newlyCreatedKey = signal<string | null>(null);
  apiEndpoint = environment.api;
  activeExampleTab = signal<'curl' | 'qgis'>('curl');
  selectedOrgId = signal<string>('');

  keysResource = rxResource({
    params: () => ({ orgId: this.selectedOrgId() }),
    stream: ({ params }) => {
      if (!params.orgId) return of([]);
      return this.http.get<any[]>(`${environment.api}/user/me/api-keys`, {
        headers: {
          'x-organization-id': params.orgId,
        },
      });
    },
  });

  constructor() {
    effect(() => {
      const orgs = this.organizationState.value().myOrganizations;
      const currentSelected = this.organizationState.selectedOrganization();

      if (orgs && orgs.length > 0 && !this.selectedOrgId()) {
        const defaultId = currentSelected?.id || orgs[0].id;
        this.selectedOrgId.set(defaultId);
      }
    });
  }

  onOrganizationChange(orgId: string) {
    this.selectedOrgId.set(orgId);
    this.newlyCreatedKey.set(null);
  }

  getSelectedOrgName(): string {
    const orgs = this.organizationState.value().myOrganizations;
    if (!orgs) return 'Entidade';
    const found = orgs.find((o) => o.id === this.selectedOrgId());
    return found ? found.name : 'Entidade';
  }

  getWfsCurlExample(): string {
    const key = this.newlyCreatedKey() || 'SUA_CHAVE_DE_API_AQUI';
    const orgId = this.selectedOrgId();
    return `curl -X GET "${this.apiEndpoint}/maps/proxy/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=urbis:lotes&outputFormat=application/json" \\\n  -H "x-api-key: ${key}" \\\n  -H "x-organization-id: ${orgId}"`;
  }

  async generateKey() {
    if (!this.newKeyName.trim() || !this.selectedOrgId()) return;

    this.submitting.set(true);
    this.newlyCreatedKey.set(null);

    this.http
      .post<any>(
        `${environment.api}/user/me/api-keys`,
        { name: this.newKeyName },
        {
          headers: {
            'x-organization-id': this.selectedOrgId(),
          },
        },
      )
      .subscribe({
        next: (res) => {
          this.newlyCreatedKey.set(res.plainKey);
          this.newKeyName = '';
          this.keysResource.reload();
          this.toaster.success('Chave de API gerada com sucesso.');
          this.submitting.set(false);
        },
        error: (err) => {
          console.error(err);
          this.toaster.error('Erro ao gerar chave de API.');
          this.submitting.set(false);
        },
      });
  }

  async revokeKey(id: string) {
    if (
      !confirm(
        'Deseja realmente revogar esta chave de API? Qualquer integração que a utilize deixará de funcionar imediatamente.',
      )
    ) {
      return;
    }

    this.http
      .delete(`${environment.api}/user/me/api-keys/${id}`, {
        headers: {
          'x-organization-id': this.selectedOrgId(),
        },
      })
      .subscribe({
        next: () => {
          this.keysResource.reload();
          this.toaster.success('Chave de API revogada com sucesso.');
        },
        error: (err) => {
          console.error(err);
          this.toaster.error('Falha ao revogar chave de API.');
        },
      });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.toaster.success('Copiada para a área de transferência.');
  }
}
