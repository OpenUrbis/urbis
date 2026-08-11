import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideGripVertical, lucideTrash2, lucidePlus } from '@ng-icons/lucide';
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
import { CreateQuestionTabDto, QuestionAnswer, QuestionTab } from '../../help.models';
import { HelpService } from '../../help.service';

@Component({
  selector: 'app-handle-question-tab',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    LoadingContent,
    LoadingButton,
    TranslateModule,
    PageStructure,
    HlmButtonDirective,
    HlmIconComponent,
    HasPermissionDirective,
    DragDropModule,
  ],
  providers: [provideIcons({ lucideGripVertical, lucideTrash2, lucidePlus })],
  templateUrl: './handle-question-tab.html',
})
export class HandleQuestionTab {
  id = signal<string | undefined>(undefined);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  savingOrder = signal<boolean>(false);

  questions = signal<QuestionAnswer[]>([]);
  tabObj = signal<QuestionTab | undefined>(undefined);

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    icon: new FormControl('info-circle', [Validators.required]),
    index: new FormControl(1, [Validators.required]),
  });

  toaster = inject(HlmToasterService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  helpService = inject(HelpService);
  confirmDialog = useConfirmDialog();
  translate = inject(TranslateService);

  constructor() {
    effect(() => {
      this.activatedRoute.params.subscribe(({ id }) => {
        if (id) {
          this.id.set(id);
          this.loadTab(id);
        }
      });
    });
  }

  async loadTab(id: string) {
    try {
      this.loading.set(true);
      const tab = await firstValueFrom(this.helpService.getTabById(id));

      this.tabObj.set(tab);
      this.form.patchValue({
        name: tab.name,
        description: tab.description,
        icon: tab.icon,
        index: tab.index,
      });

      const sorted = [...(tab.answers ?? [])].sort((a, b) => {
        const aIndex = typeof a.index === 'number' ? a.index : 999999;
        const bIndex = typeof b.index === 'number' ? b.index : 999999;
        return aIndex - bIndex;
      });
      this.questions.set(sorted);
    } catch (error) {
      console.error(error);
      this.toaster.error('Não foi possível carregar a aba.');
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
    const payload: CreateQuestionTabDto = {
      name: String(raw.name ?? '').trim(),
      description: String(raw.description ?? '').trim(),
      icon: String(raw.icon ?? '').trim(),
      index: Number(raw.index ?? 1),
    };

    try {
      this.saving.set(true);
      if (this.id()) {
        await firstValueFrom(this.helpService.updateTab(this.id()!, payload));
        this.toaster.success('Aba atualizada com sucesso.');
        this.router.navigate(['/help']);
      } else {
        const result = await firstValueFrom(this.helpService.createTab(payload));
        this.toaster.success('Aba criada com sucesso.');
        this.router.navigate(['/help/tabs', result.id, 'edit']);
      }
    } catch (error: any) {
      console.error(error);
      this.toaster.error(error?.error?.message || 'Não foi possível salvar a aba.');
    } finally {
      this.saving.set(false);
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    const current = [...this.questions()];
    moveItemInArray(current, event.previousIndex, event.currentIndex);
    this.questions.set(current);
  }

  async saveOrder() {
    const tabId = this.id();
    if (!tabId) return;

    try {
      this.savingOrder.set(true);
      await firstValueFrom(
        this.helpService.reorderTabQuestions(tabId, {
          items: this.questions().map((item, index) => ({
            questionAnswerId: item.id,
            index: index + 1,
          })),
        })
      );
      this.toaster.success('Ordem salva com sucesso.');
      this.loadTab(tabId);
    } catch (error: any) {
      console.error(error);
      this.toaster.error(error?.error?.message || 'Não foi possível salvar a ordem.');
    } finally {
      this.savingOrder.set(false);
    }
  }

  async deleteTab(id: string) {
    try {
      await this.confirmDialog(
        {
          title: 'Deseja excluir esta aba?',
          description: 'Esta ação é irreversível e removerá o vínculo com as perguntas desta aba.',
        },
        { resultMode: 'reject' }
      );

      this.loading.set(true);
      await firstValueFrom(this.helpService.deleteTab(id));
      this.toaster.success('Aba excluída com sucesso.');
      this.router.navigate(['/help'], { replaceUrl: true });
    } catch (err: any) {
      console.error(err);
      if (err?.internalMessage) return; // cancelled dialog
      this.toaster.error('Não foi possível excluir esta aba.');
      this.loading.set(false);
    }
  }
}
