import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import AwsS3 from '@uppy/aws-s3';
import Compressor from '@uppy/compressor';
import Dashboard from '@uppy/dashboard';
import ImageEditor from '@uppy/image-editor';
import Uppy from '@uppy/core';
import {
  UploaderApi,
  UploadStrategyPathEnum,
} from '../../../../../projects/shared/src/lib/components/file-uploader/services/uploader.service';

@Component({
  selector: 'app-edit-profile-avatar',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <button matMiniFab (click)="handleOpen()">
      <mat-icon class="material-symbols-outlined">create</mat-icon>
    </button>
    <div #dashboardContainer></div>
  `,
})
export class EditProfileAvatarComponent implements OnDestroy, OnInit {
  uppy!: Uppy;

  private readonly api = inject(UploaderApi);
  readonly dashboardContainer =
    viewChild.required<ElementRef>('dashboardContainer');
  readonly uploadKey = signal('');

  ngOnInit() {
    this.uppy = new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        minNumberOfFiles: 1,
        allowedFileTypes: ['image/*'],
      },
    })
      .use(Dashboard, {
        autoOpen: 'imageEditor',
        inline: false,
        target: this.dashboardContainer().nativeElement,
        closeModalOnClickOutside: true,
        closeAfterFinish: true,
      })
      .use(ImageEditor, {
        cropperOptions: {
          aspectRatio: 1,
          cropBoxResizable: false,
          dragMode: undefined,
        },
      })
      .use(Compressor)
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file) => {
          const data: any = await firstValueFrom(
            this.api.getUploadUrl({
              contentType: file.type,
              strategy: UploadStrategyPathEnum.AVATAR,
            }),
          );

          return {
            method: 'PUT',
            url: data.uploadURL,
            headers: {
              'Content-Type': file.type,
            },
          };
        },
      });

    this.uppy.on('dashboard:modal-closed', () => {
      this.uppy.cancelAll();
    });
    this.uppy.on('file-editor:cancel', () => {
      this.uppy.getPlugin('Dashboard')?.closeModal();
    });
    this.uppy.on('upload-success', () => {});
    this.uppy.on('upload-error', () => {});
  }

  handleOpen() {
    this.uppy.getPlugin('Dashboard')?.openModal();
  }

  ngOnDestroy() {
    this.uppy.cancelAll();
  }
}
