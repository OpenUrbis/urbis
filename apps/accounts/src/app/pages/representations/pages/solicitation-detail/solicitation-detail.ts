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
} from '../../../../../../projects/shared/src/public-api';
import { environment } from '../../../../../environments/environment';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { PermissionState } from '../../../../states/permission/permission.state';
import { ProfileState } from '../../../../states/profile/profile.state';
import { SolicitationApi } from '../../services/solicitation-api';

@Component({
  selector: 'app-solicitation-detail',
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
  ],
  providers: [
    AttachmentsService,
    provideIcons({
      lucideArrowLeft,
      lucideArrowRight,
      lucideCheck,
      lucideX,
      lucideMessageSquare,
      lucideHelpCircle,
      lucideFileText,
      lucideDownload,
    }),
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.googleRecaptchaSiteKey,
    },
  ],
  templateUrl: './solicitation-detail.html',
})
export class SolicitationDetail implements OnInit {
  api = inject(SolicitationApi);
  route = inject(ActivatedRoute);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  confirm = useConfirmDialog();
  toaster = inject(HlmToasterService);
  attachmentsService = inject(AttachmentsService);
  profile = inject(ProfileState);
  translate = inject(TranslateService);
  permissionState = inject(PermissionState);

  solicitation = signal<any>(null);
  selectedTabIndex = signal(0);
  loading = signal(true);
  commentControl = new FormControl('', [Validators.required]);
  attachmentsControl = new FormControl([]);
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

      // Hydrate documents
      if (res.documents && res.documents.length > 0) {
        const hydratedDocs = [];
        for (const doc of res.documents) {
          if (typeof doc === 'string') {
            const url = await this.attachmentsService.getDownloadUrl(doc);
            hydratedDocs.push({ key: doc, url, name: doc.split('/').pop() });
          } else {
            hydratedDocs.push(doc);
          }
        }
        res.documents = hydratedDocs;
      }

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

      this.solicitation.set(res);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  async approve() {
    if (
      !(await this.confirm({
        title: this.translate.instant('solicitation.actions.approve.title'),
        description: this.translate.instant(
          'solicitation.actions.approve.description',
        ),
        confirmText: this.translate.instant(
          'solicitation.actions.approve.confirm',
        ),
      }))
    )
      return;

    try {
      await firstValueFrom(this.api.approve(this.solicitation().id));
      await this.loadData(this.solicitation().id);
      this.toaster.success(
        this.translate.instant('solicitation.actions.approve.success'),
      );
    } catch (e) {
      this.toaster.error(
        this.translate.instant('solicitation.actions.approve.error'),
      );
    }
  }

  async reject() {
    if (
      !(await this.confirm({
        title: this.translate.instant('solicitation.actions.reject.title'),
        description: this.translate.instant(
          'solicitation.actions.reject.description',
        ),
        confirmText: this.translate.instant(
          'solicitation.actions.reject.confirm',
        ),
        confirmColor: 'warn',
      }))
    )
      return;

    try {
      await firstValueFrom(this.api.reject(this.solicitation().id));
      await this.loadData(this.solicitation().id);
      this.toaster.success(
        this.translate.instant('solicitation.actions.reject.success'),
      );
    } catch (e) {
      this.toaster.error(
        this.translate.instant('solicitation.actions.reject.error'),
      );
    }
  }

  async requestInfo() {
    if (this.commentControl.invalid) {
      this.toaster.error(
        this.translate.instant('solicitation.actions.requestInfo.validation'),
      );
      return;
    }
    if (
      !(await this.confirm({
        title: this.translate.instant('solicitation.actions.requestInfo.title'),
        description: this.translate.instant(
          'solicitation.actions.requestInfo.description',
        ),
        confirmText: this.translate.instant(
          'solicitation.actions.requestInfo.confirm',
        ),
      }))
    )
      return;

    try {
      await firstValueFrom(
        this.api.requestInfo(
          this.solicitation().id,
          this.commentControl.value!,
          this.attachmentsControl.value!,
        ),
      );
      this.commentControl.reset();
      this.attachmentsControl.reset([]);
      await this.loadData(this.solicitation().id);
      this.toaster.success(
        this.translate.instant('solicitation.actions.requestInfo.success'),
      );
    } catch (e) {
      this.toaster.error(
        this.translate.instant('solicitation.actions.requestInfo.error'),
      );
    }
  }

  async addComment() {
    if (this.commentControl.invalid || this.attachmentLoading()) return;
    try {
      await firstValueFrom(
        this.api.addComment(
          this.solicitation().id,
          this.commentControl.value!,
          this.attachmentsControl.value!,
        ),
      );
      this.commentControl.reset();
      this.attachmentsControl.reset([]);
      await this.loadData(this.solicitation().id);
    } catch (_e) {
      this.toaster.error(
        this.translate.instant('solicitation.actions.addComment.error'),
      );
    }
  }

  isImage(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
  }

  canApprove(item: any) {
    if (!item.organizationId) return false;
    return this.permissionState.hasPermission({
      id: 'solicitation:approve',
      organizationId: item.organizationId,
    });
  }

  canReject(item: any) {
    if (!item.organizationId) return false;
    return this.permissionState.hasPermission({
      id: 'solicitation:reject',
      organizationId: item.organizationId,
    });
  }
}
