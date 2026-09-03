import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideCheck,
  lucideDownload,
  lucideFileText,
  lucideHelpCircle,
  lucideMessageSquare,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from 'ng-recaptcha-2';
import { firstValueFrom } from 'rxjs';
import {
  AttachmentsComponent,
  AttachmentsService,
  HlmButtonDirective,
  HlmCardContentDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmIconComponent,
  HlmInputDirective,
  HlmLabelDirective,
  HlmToasterService,
  useConfirmDialog,
  LoadingContent,
} from '../../../../../../projects/shared/src/public-api';
import { environment } from '../../../../../environments/environment';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { PermissionState } from '../../../../states/permission/permission.state';
import { ProfileState } from '../../../../states/profile/profile.state';
import { RepresentationApi } from '../../services/representation-api';

@Component({
  selector: 'app-representation-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    ReactiveFormsModule,
    HlmButtonDirective,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardContentDirective,
    HlmIconComponent,
    HlmInputDirective,
    HlmLabelDirective,
    AttachmentsComponent,
    RecaptchaV3Module,
    HasPermissionDirective,
    LoadingContent,
  ],
  providers: [
    AttachmentsService,
    provideIcons({
      lucideArrowLeft,
      lucideArrowRight,
      lucideCheck,
      lucideX,
      lucideMessageSquare,
      lucideTrash2,
      lucideHelpCircle,
      lucideFileText,
      lucideDownload,
    }),
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.googleRecaptchaSiteKey,
    },
  ],
  templateUrl: './representation-detail.html',
})
export class RepresentationDetail implements OnInit {
  api = inject(RepresentationApi);
  route = inject(ActivatedRoute);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  confirm = useConfirmDialog();
  toaster = inject(HlmToasterService);
  attachmentsService = inject(AttachmentsService);
  profile = inject(ProfileState);
  translate = inject(TranslateService);
  permissionState = inject(PermissionState);

  representation = signal<any>(null);
  selectedTabIndex = signal(0);
  loading = signal(true);
  commentControl = new FormControl('', [Validators.required]);
  attachmentsControl = new FormControl([]);
  statusControl = new FormControl<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING', [Validators.required]);
  actionReasonControl = new FormControl('', [Validators.required]);
  actionAttachmentsControl = new FormControl<string[]>([]);
  userId = computed(() => this.profile.value()?.id);
  attachmentLoading = signal(false);

  async ngOnInit() {
    this.route.params.subscribe(async (params) => {
      if (params['id']) {
        await this.loadData(params['id']);
      }
    });
  }

  async loadData(id: string) {
    this.loading.set(true);
    try {
      const res: any = await firstValueFrom(this.api.findOne(id));

      // Hydrate structured document categories, retaining the category for auditing.
      if (res.documents && res.documents.length > 0) {
        const categories = Array.isArray(res.documents) && typeof res.documents[0] === 'string'
          ? [{ category: 'Documentos anexados', files: res.documents }]
          : res.documents;
        res.documentGroups = [];
        for (const category of categories) {
          const files = [];
          for (const key of category.files || []) {
            const url = await this.attachmentsService.getDownloadUrl(key);
            files.push({ key, url, name: key.split('/').pop() });
          }
          res.documentGroups.push({ category: category.category, files });
        }
      }
      this.statusControl.setValue(res.status === 'INACTIVE' ? 'PENDING' : res.status);

      // Hydrate comment attachments
      if (res.comments) {
        for (const comment of res.comments) {
          if (comment.attachments && comment.attachments.length > 0) {
            const hydratedAttachments = [];
            for (const att of comment.attachments) {
              if (typeof att === 'string') {
                const url = await this.attachmentsService.getDownloadUrl(att);
                hydratedAttachments.push({
                  key: att,
                  url,
                  name: att.split('/').pop(),
                });
              } else {
                hydratedAttachments.push(att);
              }
            }
            comment.attachments = hydratedAttachments;
          }
        }
      }

      this.representation.set(res);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  async approve() {
    if (
      !(await this.confirm({
        title: this.translate.instant('representation.actions.approve.title'),
        description: this.translate.instant(
          'representation.actions.approve.description',
        ),
        confirmText: this.translate.instant(
          'representation.actions.approve.confirm',
        ),
      }))
    )
      return;

    try {
      await firstValueFrom(this.api.approve(this.representation().id));
      await this.loadData(this.representation().id);
      this.toaster.success(
        this.translate.instant('representation.actions.approve.success'),
      );
    } catch (e) {
      this.toaster.error(
        this.translate.instant('representation.actions.approve.error'),
      );
    }
  }

  async reject() {
    if (
      !(await this.confirm({
        title: this.translate.instant('representation.actions.reject.title'),
        description: this.translate.instant(
          'representation.actions.reject.description',
        ),
        confirmText: this.translate.instant(
          'representation.actions.reject.confirm',
        ),
        confirmColor: 'warn',
      }))
    )
      return;

    try {
      await firstValueFrom(this.api.reject(this.representation().id));
      await this.loadData(this.representation().id);
      this.toaster.success(
        this.translate.instant('representation.actions.reject.success'),
      );
    } catch (e) {
      this.toaster.error(
        this.translate.instant('representation.actions.reject.error'),
      );
    }
  }

  async saveStatus() {
    if (this.actionReasonControl.invalid || this.attachmentLoading()) {
      this.actionReasonControl.markAsTouched();
      return;
    }
    try {
      await firstValueFrom(
        this.api.updateStatus(
          this.representation().id,
          this.statusControl.value!,
          this.actionReasonControl.value!,
          this.actionAttachmentsControl.value!,
        ),
      );
      this.actionReasonControl.reset();
      this.actionAttachmentsControl.reset([]);
      await this.loadData(this.representation().id);
      this.toaster.success('Representação atualizada com sucesso.');
    } catch (_error) {
      this.toaster.error('Não foi possível atualizar a representação.');
    }
  }

  async inactivate() {
    if (this.actionReasonControl.invalid || this.attachmentLoading()) {
      this.actionReasonControl.markAsTouched();
      return;
    }
    if (!(await this.confirm({
      title: 'Excluir representação',
      description: 'A representação será inativada e permanecerá no histórico.',
      confirmText: 'Excluir',
      confirmColor: 'warn',
    }))) return;
    try {
      await firstValueFrom(
        this.api.updateStatus(
          this.representation().id,
          'INACTIVE',
          this.actionReasonControl.value!,
          this.actionAttachmentsControl.value!,
        ),
      );
      await this.loadData(this.representation().id);
      this.toaster.success('Representação inativada com sucesso.');
    } catch (_error) {
      this.toaster.error('Não foi possível inativar a representação.');
    }
  }

  async requestInfo() {
    if (this.commentControl.invalid) {
      this.toaster.error(
        this.translate.instant('representation.actions.requestInfo.validation'),
      );
      return;
    }
    if (
      !(await this.confirm({
        title: this.translate.instant(
          'representation.actions.requestInfo.title',
        ),
        description: this.translate.instant(
          'representation.actions.requestInfo.description',
        ),
        confirmText: this.translate.instant(
          'representation.actions.requestInfo.confirm',
        ),
      }))
    )
      return;

    try {
      await firstValueFrom(
        this.api.requestInfo(
          this.representation().id,
          this.commentControl.value!,
          this.attachmentsControl.value!,
        ),
      );
      this.commentControl.reset();
      this.attachmentsControl.reset([]);
      await this.loadData(this.representation().id);
      this.toaster.success(
        this.translate.instant('representation.actions.requestInfo.success'),
      );
    } catch (e) {
      this.toaster.error(
        this.translate.instant('representation.actions.requestInfo.error'),
      );
    }
  }

  async addComment() {
    if (this.commentControl.invalid || this.attachmentLoading()) return;
    try {
      await firstValueFrom(
        this.api.addComment(
          this.representation().id,
          this.commentControl.value!,
          this.attachmentsControl.value!,
        ),
      );
      this.commentControl.reset();
      this.attachmentsControl.reset([]);
      await this.loadData(this.representation().id);
    } catch (_e) {
      this.toaster.error(
        this.translate.instant('representation.actions.addComment.error'),
      );
    }
  }

  isImage(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
  }

  canApprove(item: any) {
    if (String(item.requesterId) === String(this.userId())) return false;
    const orgId = item.organizationId || item.organization?.id;
    if (!orgId) return false;
    return this.permissionState.hasPermission({
      id: 'representation:approve',
      organizationId: orgId,
    });
  }

  canReject(item: any) {
    if (String(item.requesterId) === String(this.userId())) return false;
    const orgId = item.organizationId || item.organization?.id;
    if (!orgId) return false;
    return this.permissionState.hasPermission({
      id: 'representation:reject',
      organizationId: orgId,
    });
  }
}
