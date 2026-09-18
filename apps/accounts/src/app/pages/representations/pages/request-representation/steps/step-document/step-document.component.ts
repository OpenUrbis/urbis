import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideHelpCircle,
  lucideInfo,
} from '@ng-icons/lucide';
import {
  AttachmentsComponent,
  HlmButtonDirective,
  HlmInputDirective,
  HlmLabelDirective,
  HlmIconComponent,
} from '../../../../../../../../projects/shared/src/public-api';
import { CpfCnpjPipe } from '../../../../../../pipes/cpf-cnpj.pipe';
import { anonymizePersonName } from './anonymize-person-name';

@Component({
  selector: 'app-step-document',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterModule,
    HlmButtonDirective,
    HlmInputDirective,
    HlmLabelDirective,
    HlmIconComponent,
    AttachmentsComponent,
    CpfCnpjPipe,
  ],
  providers: [
    provideIcons({
      lucideHelpCircle,
      lucideInfo,
    }),
  ],
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="submit.emit()">
      <div class="flex flex-col space-y-6 animate-in fade-in duration-500">
        <!-- Cabeçalho Limpo - Sem cards ou bordas extras! -->
        <div class="pb-5 border-b border-border/60">
          <span
            class="text-[10px] font-bold text-primary uppercase tracking-wider"
            >Passo 2: Dados e Documentos</span
          >
          <h2 class="text-lg font-bold text-foreground mt-1">
            Representando como: {{ selectedTypeLabel }}
          </h2>
          <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
            Para este vínculo, solicitamos os dados de uma
            <strong>{{
              representedTypeDescription()
            }}</strong
            >.
          </p>
        </div>

        <!-- Documento CPF/CNPJ -->
        <div class="space-y-1.5">
          <label hlmLabel for="document" class="font-semibold text-sm">
            {{ isCnpj ? 'CNPJ do Representado' : 'CPF do Representado' }}
          </label>
          <p class="text-xs text-muted-foreground leading-relaxed">
            @if (isCnpj) {
              Informe o CNPJ e, se desejar, use <strong>Buscar</strong> para sugerir os dados da entidade.
            } @else {
              Informe o CPF e preencha manualmente os dados do representado. O CPF não é consultado; os nomes exibidos são fornecidos pelo solicitante e apresentados de forma anonimizada.
            }
          </p>
          @if (isCnpj) {
            <p class="text-xs text-muted-foreground leading-relaxed">
              Os dados de Pessoa Jurídica são consultados na base OpenCNPJ. Em caso de erro ou desatualização, revise e corrija os campos abaixo antes de enviar a solicitação.
            </p>
          }
          <div class="flex gap-2 pt-1">
            <input
              hlmInput
              id="document"
              formControlName="document"
              [placeholder]="
                isCnpj ? 'Ex: 00.000.000/0001-00' : 'Ex: 000.000.000-00'
              "
              (input)="onDocumentInput.emit($event)"
              maxlength="18"
              class="flex-1"
            />
            @if (isCnpj) {
              <button
                type="button"
                hlmBtn
                [disabled]="loading || formGroup.controls['document'].invalid"
                (click)="checkDocument.emit()"
                class="shrink-0"
              >
                {{ loading ? 'Buscando...' : 'Buscar' }}
              </button>
            }
          </div>
        </div>

        @if (isCnpj && cnpjLookupMessage) {
          <div class="flex items-start gap-2.5 rounded-lg border border-primary/10 bg-primary/5 p-3 text-xs text-muted-foreground">
            <hlm-icon name="lucideInfo" class="mt-0.5 shrink-0 text-primary" size="14" />
            <span>{{ cnpjLookupMessage }}</span>
          </div>
        }

        <!-- Dados do representado -->
        <div class="space-y-4">
          <div class="space-y-1">
            <h4 class="font-bold text-sm text-foreground">
              Dados do Representado
            </h4>
            <p class="text-xs text-muted-foreground leading-relaxed">
              @if (isCnpj) {
                Os dados cadastrais de Pessoa Jurídica são consultados na base pública OpenCNPJ. Em caso de divergência ou desatualização, revise e corrija os campos abaixo antes de enviar a solicitação.
              } @else {
                Os dados de nome são fornecidos pelo solicitante no ato do requerimento e apresentados de forma anonimizada para conformidade com a LGPD.
              }
            </p>
          </div>
          @if (isCnpj) {
            <div class="space-y-1.5">
              <label
                hlmLabel
                for="companyName"
                class="font-semibold text-xs text-muted-foreground"
                >Razão Social</label
              >
              <input
                hlmInput
                id="companyName"
                formControlName="companyName"
                class="w-full"
                placeholder="Razão social da entidade"
              />
            </div>
            <div class="space-y-1.5">
              <label
                hlmLabel
                for="tradeName"
                class="font-semibold text-xs text-muted-foreground"
                >Nome Fantasia (Opcional)</label
              >
              <input
                hlmInput
                id="tradeName"
                formControlName="tradeName"
                class="w-full"
                placeholder="Nome fantasia ou sigla"
              />
            </div>
          } @else {
            <div class="space-y-1.5">
              <label
                hlmLabel
                for="name"
                class="font-semibold text-xs text-muted-foreground"
                >Nome Completo Anonimizado</label
              >
              <input
                hlmInput
                id="name"
                formControlName="name"
                class="w-full"
                placeholder="Nome completo anonimizado"
                (blur)="anonymizePersonalName('name')"
              />
            </div>
            <div class="space-y-1.5">
              <label
                hlmLabel
                for="socialName"
                class="font-semibold text-xs text-muted-foreground"
                >Nome Social Anonimizado (Opcional)</label
              >
              <input
                hlmInput
                id="socialName"
                formControlName="socialName"
                class="w-full"
                placeholder="Nome social anonimizado (opcional)"
                (blur)="anonymizePersonalName('socialName')"
              />
            </div>
          }
        </div>

        <!-- Co-representantes / Múltiplos Representantes (Apenas para PJ, Pais e Procuradores) -->
        @if (showMultipleReps()) {
          <div class="pt-5 border-t border-border/60 space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <label
                  for="hasOtherReps"
                  class="font-bold text-sm text-foreground block cursor-pointer"
                  >Múltiplos Representantes</label
                >
                <p
                  class="text-[11px] text-muted-foreground leading-normal mt-0.5"
                >
                  Informe outros responsáveis ou representantes vinculados. Esta informação é apenas para análise da Prefeitura e não exige aceite dos co-representantes.
                </p>
              </div>
              <input
                type="checkbox"
                id="hasOtherReps"
                [formControl]="$any(formGroup.get('hasOtherRepresentatives'))"
                class="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer mt-1"
              />
            </div>

            @if (formGroup.get('hasOtherRepresentatives')?.value) {
              <div
                class="space-y-3 pt-1 animate-in slide-in-from-top duration-300"
              >
                <div class="space-y-1.5">
                  <label
                    hlmLabel
                    for="repCpf"
                    class="font-semibold text-xs text-muted-foreground"
                  >
                    CPF do Outro Representante Legal
                  </label>
                  <div class="flex gap-2">
                    <input
                      hlmInput
                      id="repCpf"
                      placeholder="Ex: 000.000.000-00"
                      maxlength="14"
                      [formControl]="newRepCpfControl"
                      (input)="onCpfInput($event)"
                      class="flex-1 text-xs"
                    />
                    <button
                      type="button"
                      hlmBtn
                      variant="outline"
                      size="sm"
                      [disabled]="newRepCpfControl.value!.length < 14"
                      (click)="addRepresentative()"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                <!-- Lista de CPFs Adicionados -->
                @if (addedCPFs().length > 0) {
                  <div class="space-y-1.5 pt-1">
                    <span
                      class="text-[10px] font-bold text-muted-foreground block"
                      >Co-representantes Informados:</span
                    >
                    <div class="space-y-1.5">
                      @for (cpf of addedCPFs(); track cpf) {
                        <div
                          class="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 text-xs"
                        >
                          <span class="font-medium text-foreground">{{
                            cpf | cpfCnpj
                          }}</span>
                          <button
                            type="button"
                            class="text-red-600 hover:text-red-700 text-[11px] font-semibold focus:outline-none"
                            (click)="removeRepresentative(cpf)"
                          >
                            Remover
                          </button>
                        </div>
                      }
                    </div>
                  </div>

                  @if (isParentalAuthority()) {
                    <div class="flex items-start gap-2 rounded-lg border border-primary/10 bg-primary/5 p-3 text-xs text-muted-foreground">
                      <hlm-icon name="lucideInfo" class="mt-0.5 shrink-0 text-primary" size="14" />
                      <span>Quando ambos os pais exercem o poder familiar, informe o outro genitor. A Prefeitura avaliará a documentação apresentada.</span>
                    </div>
                  }
                }

                <p class="text-[10px] text-muted-foreground leading-normal italic pt-1">
                  Os co-representantes informados são apenas referenciais para a análise e não precisam aceitar esta solicitação.
                </p>
              </div>
            }
          </div>
        }

        <div class="flex items-start gap-2.5 border-t border-border/60 bg-primary/5 p-3.5 text-xs text-muted-foreground">
          <hlm-icon name="lucideInfo" class="mt-0.5 shrink-0 text-primary" size="14" />
          <div>
            <span class="font-bold text-foreground block mb-0.5">Análise da Prefeitura</span>
            Esta representação terá que ser analisada pela Prefeitura para produzir qualquer efeito.
          </div>
        </div>

        <!-- Anexos de Comprovação Documental -->
        <div class="pt-5 border-t border-border/60 space-y-3">
          <label hlmLabel class="font-semibold text-sm">
            Comprovação Documental Obrigatória
          </label>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Para que o seu pedido de representação seja analisado e aprovado,
            você precisa anexar o(s) documento(s) listado(s) abaixo.
            Certifique-se de que cada arquivo contenha o documento completo, em folhas sequenciais e legíveis.
          </p>

          <div class="space-y-4">
            @for (doc of requiredDocs; track doc.category) {
              <div class="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs">
                <div class="mb-2 font-bold text-sm">
                  {{ doc.label }}
                </div>
                <lib-attachments
                  [formControl]="documentCategoryControl(doc.category)"
                  (isLoading)="onAttachmentLoading($event)"
                />
              </div>
            }
          </div>
          @if (formGroup.controls['documents'].touched && formGroup.controls['documents'].invalid) {
            <p class="text-xs text-destructive">Anexe pelo menos um arquivo em cada categoria obrigatória.</p>
          }
        </div>

        <!-- Aviso de Aprovação e Submissão -->
        <div class="pt-5 border-t border-border/60">
          <div
            class="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs"
          >
            <h4
              class="font-bold text-sm text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-2"
            >
              <hlm-icon name="lucideInfo" size="16" />
              O que acontece após o envio?
            </h4>
            <p
              class="text-blue-700/90 dark:text-blue-200/90 leading-relaxed mb-2"
            >
              Sua solicitação ficará com o status de
              <strong>Pendente</strong> até ser analisada e aprovada:
            </p>
            <ul class="list-disc pl-5 space-y-1.5 text-blue-700/80 dark:text-blue-200/80 font-medium">
              <li>
                <strong>A Prefeitura analisará os documentos anexados.</strong>
              </li>
              @if (formGroup.get('hasOtherRepresentatives')?.value) {
                <li>Os co-representantes são apenas informativos e não precisam aceitar a solicitação.</li>
              }
            </ul>
            <p
              class="text-[11px] text-blue-700/70 dark:text-blue-200/70 mt-3 pt-2 border-t border-blue-500/10"
            >
              Você será notificado por e-mail assim que a análise for concluída.
            </p>
          </div>

          <div class="flex justify-end gap-2 pt-6">
            <button
              hlmBtn
              variant="outline"
              type="button"
              (click)="goBack.emit()"
            >
              Voltar
            </button>
            <button
              hlmBtn
              type="submit"
              [disabled]="
                loading ||
                formGroup.controls['document'].invalid ||
                (isCnpj
                  ? formGroup.controls['companyName'].invalid
                  : formGroup.controls['name'].invalid) ||
                formGroup.controls['documents'].invalid
              "
            >
              {{ loading ? 'Enviando...' : 'Enviar Solicitação' }}
            </button>
          </div>
        </div>
      </div>
    </form>
  `,
})
export class StepDocumentComponent implements OnInit {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() loading: boolean = false;
  @Input() isCnpj: boolean = false;
  @Input() cnpjLookupMessage: string = '';
  @Input() selectedTypeLabel: string = '';
  @Input() requiredDocs: { category: string; label: string }[] = [];

  @Output() onDocumentInput = new EventEmitter<any>();
  @Output() checkDocument = new EventEmitter<void>();
  @Output() goBack = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  newRepCpfControl = new FormControl('');
  addedCPFs = signal<string[]>([]);
  private readonly documentCategoryControls = new Map<
    string,
    FormControl<unknown[]>
  >();

  ngOnInit() {
    this.anonymizePersonalName('name');
    this.anonymizePersonalName('socialName');

    this.formGroup.get('representationType')?.valueChanges.subscribe(() => {
      this.documentCategoryControls.clear();
      this.addedCPFs.set([]);
    });
  }

  anonymizePersonalName(controlName: 'name' | 'socialName') {
    if (this.isCnpj) return;

    const control = this.formGroup.get(controlName);
    if (control?.value) {
      control.setValue(anonymizePersonName(control.value), { emitEvent: false });
    }
  }

  showMultipleReps() {
    const type = this.formGroup.get('representationType')?.value;
    return [
      'parental_authority_incapable',
      'parental_authority_relatively_incapable',
      'attorney',
      'representative',
    ].includes(type);
  }

  representedTypeDescription() {
    const type = this.formGroup.get('representationType')?.value;
    const descriptions: Record<string, string> = {
      attorney: 'Pessoa Física Capaz (emancipada ou não) ou Assistida (Relativamente Incapaz) (CPF)',
      executor: 'Pessoa Física Capaz (emancipada ou não), Assistida (Relativamente Incapaz), ou Incapaz (sob curatela ou menor de 16 anos) (CPF)',
      parental_authority_relatively_incapable: 'Pessoa Física Assistida (Relativamente Incapaz) (CPF)',
      curator_of_vacant_heritage: 'Pessoa Física Capaz (emancipada ou não), Assistida (Relativamente Incapaz), ou Incapaz (sob curatela ou menor de 16 anos) (CPF)',
      syndic_or_administrator: 'Condomínio Edilício (CNPJ)',
    };
    return descriptions[type] || (this.isCnpj ? 'Pessoa Jurídica (CNPJ)' : 'Pessoa Física (CPF)');
  }

  isParentalAuthority() {
    const type = this.formGroup.get('representationType')?.value;
    return [
      'parental_authority_incapable',
      'parental_authority_relatively_incapable',
    ].includes(type);
  }

  documentCategoryControl(category: string) {
    const existingControl = this.documentCategoryControls.get(category);
    if (existingControl) return existingControl;

    const documentsControl = this.formGroup.get('documents') as FormControl<
      { category: string; files: unknown[] }[]
    >;
    const categoryDocument = (documentsControl.value ?? []).find(
      (document) => document.category === category,
    );
    const control = new FormControl<unknown[]>(categoryDocument?.files ?? [], {
      nonNullable: true,
    });
    control.valueChanges.subscribe((files) => {
      const documents = (documentsControl.value ?? []).filter(
        (document) => document.category !== category,
      );
      documentsControl.setValue([...documents, { category, files }]);
      documentsControl.markAsTouched();
    });
    this.documentCategoryControls.set(category, control);
    return control;
  }

  onAttachmentLoading(isLoading: boolean) {
    if (!isLoading) {
      this.formGroup.get('documents')?.updateValueAndValidity();
    }
  }

  onCpfInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    if (value.length > 9) {
      value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9)}`;
    } else if (value.length > 6) {
      value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6)}`;
    } else if (value.length > 3) {
      value = `${value.substring(0, 3)}.${value.substring(3)}`;
    }
    this.newRepCpfControl.setValue(value, { emitEvent: false });
  }

  addRepresentative() {
    const cpf = this.newRepCpfControl.value;
    if (cpf && cpf.replace(/\D/g, '').length === 11) {
      const cleanCpf = cpf.replace(/\D/g, '');
      if (!this.addedCPFs().includes(cleanCpf)) {
        this.addedCPFs.update((list) => [...list, cleanCpf]);
        this.formGroup.get('otherRepresentatives')?.setValue(this.addedCPFs());

      }
      this.newRepCpfControl.reset('');
    }
  }

  removeRepresentative(cpf: string) {
    this.addedCPFs.update((list) => list.filter((item) => item !== cpf));
    this.formGroup.get('otherRepresentatives')?.setValue(this.addedCPFs());
  }
}
