import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideTrash2, lucideSave } from '@ng-icons/lucide';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import {
  HlmButtonDirective,
  HlmIconComponent,
  HlmToasterService,
  LoadingContent,
  LoadingButton,
  useConfirmDialog,
} from '../../../../../../projects/shared/src/public-api';
import { PageStructure } from '../../../../components/page-structure/page-structure';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { CreateQuestionAnswerDto, QuestionTab } from '../../help.models';
import { HelpService } from '../../help.service';

@Component({
  selector: 'app-handle-question-answer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    LoadingContent,
    LoadingButton,
    TranslateModule,
    PageStructure,
    HlmButtonDirective,
    HlmIconComponent,
    HasPermissionDirective,
  ],
  providers: [provideIcons({ lucideTrash2, lucideSave })],
  templateUrl: './handle-question-answer.html',
})
export class HandleQuestionAnswer {
  id = signal<string | undefined>(undefined);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);

  tabs = signal<QuestionTab[]>([]);

  form = new FormGroup({
    question: new FormControl('', [Validators.required]),
    answer: new FormControl('', [Validators.required]),
    tabSelections: new FormArray<FormControl<boolean | null>>([]),
    appsSelections: new FormArray<FormControl<boolean | null>>([]),
  });

  appsOptions = [
    { value: 'mosaico', label: 'Mosaico' },
    { value: 'mapa', label: 'Mapa' },
    { value: 'viabiliza', label: 'Viabiliza' },
    { value: 'legis', label: 'Legis' },
    { value: 'docs', label: 'Docs' },
  ];

  selectAllApps() {
    console.log('selecting all apps', this.appsSelections);
    this.appsSelections.controls.forEach((formControl) =>
      formControl.setValue(true),
    );
  }

  deselectAllApps() {
    this.appsSelections.controls.forEach((formControl) =>
      formControl.setValue(false),
    );
  }

  selectAllTabs() {
    this.tabSelections.controls.forEach((formControl) =>
      formControl.setValue(true),
    );
  }

  deselectAllTabs() {
    this.tabSelections.controls.forEach((formControl) =>
      formControl.setValue(false),
    );
  }

  toaster = inject(HlmToasterService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  helpService = inject(HelpService);
  confirmDialog = useConfirmDialog();
  translate = inject(TranslateService);

  get tabSelections(): FormArray {
    return this.form.get('tabSelections') as FormArray;
  }

  get appsSelections(): FormArray {
    return this.form.get('appsSelections') as FormArray;
  }

  constructor() {
    this.appsOptions.forEach(() => {
      this.appsSelections.push(new FormControl(false));
    });

    effect(() => {
      this.activatedRoute.params.subscribe(({ id }) => {
        this.loadData(id);
      });
    });
  }

  async loadData(id?: string) {
    try {
      this.loading.set(true);

      const tabs = await firstValueFrom(this.helpService.listTabs());
      const sortedTabs = [...tabs].sort((a, b) => a.index - b.index);
      this.tabs.set(sortedTabs);

      this.tabSelections.clear();
      for (const _tab of sortedTabs) {
        this.tabSelections.push(new FormControl(false));
      }

      this.appsSelections.controls.forEach((ctrl) => ctrl.setValue(false));

      if (id) {
        this.id.set(id);
        const question = await firstValueFrom(
          this.helpService.getQuestionById(id),
        );

        this.form.patchValue({
          question: question.question,
          answer: question.answer,
        });

        const selectedTabIds = new Set(
          question.tabIds ?? question.tabs?.map((tab) => tab.id) ?? [],
        );

        this.tabs().forEach((tab, index) => {
          this.tabSelections.at(index).setValue(selectedTabIds.has(tab.id));
        });

        const selectedApps = new Set(question.apps ?? []);
        this.appsOptions.forEach((appOption, index) => {
          this.appsSelections
            .at(index)
            .setValue(selectedApps.has(appOption.value));
        });
      } else {
        const tabId = this.activatedRoute.snapshot.queryParamMap.get('tabId');
        if (tabId) {
          this.tabs().forEach((tab, index) => {
            this.tabSelections.at(index).setValue(tab.id === tabId);
          });
        }
      }
    } catch (error) {
      console.error(error);
      this.toaster.error('Não foi possível carregar os dados.');
      this.router.navigate(['/help']);
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const selectedTabIds = this.tabs()
      .filter((_tab, index) => !!raw.tabSelections?.[index])
      .map((tab) => tab.id);

    const selectedApps = this.appsOptions
      .filter((_app, index) => !!raw.appsSelections?.[index])
      .map((app) => app.value);

    const payload: CreateQuestionAnswerDto = {
      question: String(raw.question ?? '').trim(),
      answer: String(raw.answer ?? '').trim(),
      tabIds: selectedTabIds,
      apps: selectedApps,
    };

    try {
      this.saving.set(true);
      if (this.id()) {
        await firstValueFrom(
          this.helpService.updateQuestion(this.id()!, payload),
        );
        this.toaster.success('Pergunta atualizada com sucesso.');
        this.router.navigate(['/help']);
      } else {
        await firstValueFrom(this.helpService.createQuestion(payload));
        this.toaster.success('Pergunta criada com sucesso.');
        const tabId = this.activatedRoute.snapshot.queryParamMap.get('tabId');
        if (tabId) {
          this.router.navigate(['/help/tabs', tabId, 'edit']);
        } else {
          this.router.navigate(['/help/questions']);
        }
      }
    } catch (error: any) {
      console.error(error);
      this.toaster.error(
        error?.error?.message || 'Não foi possível salvar a pergunta.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  async deleteQuestion(id: string) {
    try {
      await this.confirmDialog(
        {
          title: 'Deseja excluir esta pergunta?',
          description: 'Esta ação é irreversível.',
        },
        { resultMode: 'reject' },
      );

      this.loading.set(true);
      await firstValueFrom(this.helpService.deleteQuestion(id));
      this.toaster.success('Pergunta excluída com sucesso.');
      this.router.navigate(['/help'], { replaceUrl: true });
    } catch (err: any) {
      console.error(err);
      if (err?.internalMessage) return; // cancelled dialog
      this.toaster.error('Não foi possível excluir esta pergunta.');
      this.loading.set(false);
    }
  }

  goBack(): void {
    const tabId = this.activatedRoute.snapshot.queryParamMap.get('tabId');
    if (tabId) {
      this.router.navigate(['/help', tabId, 'edit']);
    } else {
      this.router.navigate(['/help']);
    }
  }
}
