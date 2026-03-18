import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
// @ts-ignore
import Uppy from '@uppy/core';
import {
  UploaderApi,
  UploadStrategyPathEnum,
} from './services/uploader.service';
import { DashboardComponent } from '@uppy/angular';

@Component({
  imports: [CommonModule, DashboardComponent],
  selector: 'lib-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FileUploaderComponent implements OnInit, OnDestroy, OnChanges {
  @Input() id: string = 'uppy-uploader';
  @Input() label: string = 'Upload File';
  @Input() currentUrl: string | null = null;
  @Input() allowedFileTypes: string[] = ['image/*'];
  @Input() uploadStrategy: UploadStrategyPathEnum =
    UploadStrategyPathEnum.LOGOTYPE;
  @Input() width: string | number = '100%';
  @Input() height: number = 200;
  @Input() previewBackground: 'light' | 'dark' = 'light';
  @Input({ required: true }) organizationId: string = '';

  @Output() fileUploaded = new EventEmitter<string>();
  @Output() fileRemoved = new EventEmitter<void>();

  uppy: any;
  dashboardProps: any;
  isBrowser: boolean;

  constructor(
    private uploaderService: UploaderApi,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.initUppy();
    }

    this.dashboardProps = {
      inline: true,
      width: this.width,
      height: this.height,
      hideUploadButton: true,
      hideRetryButton: true,
      hidePauseResumeButton: true,
      hideCancelButton: true,
      hideProgressAfterFinish: true,
      showRemoveButtonAfterComplete: true,
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle external changes to currentUrl if needed, e.g. resetting state
  }

  ngOnDestroy(): void {
    if (this.uppy) {
      this.uppy.destroy();
    }
  }

  private initUppy(): void {
    // Ensure unique ID for Uppy instance to prevent collision
    const uppyId = this.id + '-' + Math.random().toString(36).substr(2, 9);
    this.uppy = new Uppy({
      id: uppyId,
      autoProceed: true,
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: this.allowedFileTypes,
      },
    });

    this.uppy.on('file-added', (file: any) => {
      this.uploadFile(file);
    });

    this.uppy.on('file-removed', () => {
      this.currentUrl = null;
      this.fileRemoved.emit();
    });
  }

  private uploadFile(file: any) {
    const mimeType = file.type || 'application/octet-stream';

    this.uploaderService
      .upload(
        {
          contentType: mimeType,
          strategy: this.uploadStrategy,
          parameters: {
            organizationId: this.organizationId,
            theme: this.previewBackground,
          },
        },
        file.data,
      )
      .subscribe({
        next: (result) => {
          this.currentUrl = result.urlFile;
          this.fileUploaded.emit(result.urlFile);
          this.uppy.setFileState(file.id, {
            progress: { uploadComplete: true },
          });
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.uppy.removeFile(file.id);
          // Optionally emit an error event
        },
      });
  }
}
