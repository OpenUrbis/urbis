import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HlmButtonDirective } from '../../../../../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-step-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmButtonDirective,
  ],
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="goToStep2.emit()">
      <div class="flex flex-col space-y-4 animate-in fade-in duration-500">
        <!-- Cabeçalho explicativo limpo -->
        <div class="text-center sm:text-left">
          <h4 class="font-bold text-base text-foreground">
            Selecione o seu Tipo de Vínculo Legal
          </h4>
          <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Escolha abaixo o papel exato que você desempenha em relação à pessoa
            ou entidade que deseja representar.
          </p>
        </div>

        <!-- Contêiner de Lista Compacta Unificado -->
        <div
          class="space-y-1 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar border border-border/50 rounded-xl p-3 bg-muted/10"
        >
          <!-- Vínculos Comuns -->
          @for (type of commonTypes(); track type.value; let last = $last) {
            <label
              class="flex items-start gap-3 py-3 cursor-pointer group transition-all"
              [class.border-b]="!last || rareTypes().length > 0"
              [class.border-border/40]="!last || rareTypes().length > 0"
            >
              <!-- Circulo Rádio Customizado -->
              <div
                class="relative flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/40 shrink-0 mt-0.5 group-hover:border-primary transition-colors"
                [class.border-primary]="
                  formGroup.get('representationType')?.value === type.value
                "
              >
                <div
                  class="h-2 w-2 rounded-full bg-primary transition-all scale-0"
                  [class.scale-100]="
                    formGroup.get('representationType')?.value === type.value
                  "
                ></div>
                <input
                  type="radio"
                  [value]="type.value"
                  [checked]="
                    formGroup.get('representationType')?.value === type.value
                  "
                  (click)="selectType(type.value)"
                  class="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <!-- Detalhes do Vínculo -->
              <div class="space-y-1 flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="font-bold text-xs text-foreground group-hover:text-primary transition-colors leading-tight"
                    [class.text-primary]="
                      formGroup.get('representationType')?.value === type.value
                    "
                  >
                    {{ type.label }}
                  </span>
                  <span
                    class="px-1.5 py-0.5 rounded text-[8px] font-bold inline-block border shrink-0"
                    [ngClass]="
                      type.docType === 'CNPJ'
                        ? 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/40'
                        : 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900/40'
                    "
                  >
                    {{ type.docType }}
                  </span>
                </div>
                <p
                  class="text-[11px] text-muted-foreground leading-relaxed font-medium"
                >
                  {{ type.description }}
                </p>
              </div>
            </label>
          }

          <!-- Botão Exibir Ocultos -->
          @if (rareTypes().length > 0) {
            <div class="py-2 flex justify-center">
              <button
                type="button"
                (click)="toggleRareOptions()"
                class="text-xs font-semibold text-primary/80 hover:text-primary transition-colors focus:outline-none px-4 py-1.5 rounded-full hover:bg-primary/10"
              >
                {{
                  showRareOptions() ? 'Ocultar mais opções' : 'Exibir mais opções (Massa falida, Curatela, Herança...)'
                }}
              </button>
            </div>
          }

          <!-- Vínculos Específicos/Raros -->
          @if (showRareOptions()) {
            <div class="animate-in slide-in-from-top-2 fade-in duration-300">
              @for (type of rareTypes(); track type.value; let last = $last) {
                <label
                  class="flex items-start gap-3 py-3 cursor-pointer group transition-all"
                  [class.border-b]="!last"
                  [class.border-border/40]="!last"
                  [class.border-t]="$first"
                  [class.border-border/40]="$first"
                >
                  <div
                    class="relative flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/40 shrink-0 mt-0.5 group-hover:border-primary transition-colors"
                    [class.border-primary]="
                      formGroup.get('representationType')?.value === type.value
                    "
                  >
                    <div
                      class="h-2 w-2 rounded-full bg-primary transition-all scale-0"
                      [class.scale-100]="
                        formGroup.get('representationType')?.value ===
                        type.value
                      "
                    ></div>
                    <input
                      type="radio"
                      [value]="type.value"
                      [checked]="
                        formGroup.get('representationType')?.value ===
                        type.value
                      "
                      (click)="selectType(type.value)"
                      class="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  <div class="space-y-1 flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="font-bold text-xs text-foreground group-hover:text-primary transition-colors leading-tight"
                        [class.text-primary]="
                          formGroup.get('representationType')?.value ===
                          type.value
                        "
                      >
                        {{ type.label }}
                      </span>
                      <span
                        class="px-1.5 py-0.5 rounded text-[8px] font-bold inline-block border shrink-0"
                        [ngClass]="
                          type.docType === 'CNPJ'
                            ? 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/40'
                            : 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900/40'
                        "
                      >
                        {{ type.docType }}
                      </span>
                    </div>
                    <p
                      class="text-[11px] text-muted-foreground leading-relaxed font-medium"
                    >
                      {{ type.description }}
                    </p>
                  </div>
                </label>
              }
            </div>
          }
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-border">
          <button hlmBtn variant="outline" type="button" routerLink="..">
            Cancelar
          </button>
          <button
            hlmBtn
            type="submit"
            [disabled]="formGroup.controls['representationType'].invalid"
          >
            Avançar
          </button>
        </div>
      </div>
    </form>
  `,
})
export class StepDetailsComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() representationTypes: {
    value: string;
    label: string;
    description: string;
    docType: string;
    isRare?: boolean;
  }[] = [];

  @Output() goBack = new EventEmitter<void>();
  @Output() goToStep2 = new EventEmitter<void>();

  showRareOptions = signal(false);

  commonTypes = computed(() =>
    this.representationTypes.filter((t) => !t.isRare),
  );
  rareTypes = computed(() => this.representationTypes.filter((t) => t.isRare));

  selectType(value: string) {
    this.formGroup.get('representationType')?.setValue(value);
  }

  toggleRareOptions() {
    this.showRareOptions.update((v) => !v);
  }
}
