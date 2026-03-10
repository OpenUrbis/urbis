import { CommonModule } from '@angular/common';
import { Component, forwardRef, inject, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
  lucideDownload,
  lucideFileText,
  lucideLoader2,
  lucidePaperclip,
  lucideX,
} from '@ng-icons/lucide';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from 'ng-recaptcha-2';
import { environment } from '../../../../../../src/environments/environment';
import { HlmIconComponent } from '../../../public-api';
import {
  AttachmentsService,
  UploadResult,
} from './services/attachments.service';

@Component({
  selector: 'lib-attachments',
  standalone: true,
  imports: [CommonModule, HlmIconComponent, RecaptchaV3Module],
  providers: [
    AttachmentsService,
    provideIcons({
      lucideLoader2,
      lucideX,
      lucidePaperclip,
      lucideFileText,
      lucideDownload,
    }),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AttachmentsComponent),
      multi: true,
    },
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.googleRecaptchaSiteKey,
    },
  ],
  templateUrl: './attachments.component.html',
})
export class AttachmentsComponent implements ControlValueAccessor {
  service = inject(AttachmentsService);

  files = signal<UploadResult[]>([]);
  isUploading = signal(false);
  uploadCount = signal(0);
  error = signal<string | null>(null);
  isLoading = output<boolean>();

  // ControlValueAccessor
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(obj: any): void {
    if (obj) {
      if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'string') {
        this.loadFilesFromKeys(obj);
      } else {
        this.files.set(obj);
      }
    } else {
      this.files.set([]);
    }
  }

  async loadFilesFromKeys(keys: string[]) {
    try {
      const results: UploadResult[] = [];
      for (const key of keys) {
        const url = await this.service.getDownloadUrl(key);
        results.push({
          key,
          url,
          name: key.split('/').pop() || key,
        });
      }
      this.files.set(results);
    } catch (e) {
      console.error('Failed to load files', e);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  async handleFileChange(event: any) {
    const fileList = event.target.files;
    if (!fileList || !fileList.length) return;

    this.error.set(null);
    this.isUploading.set(true);
    this.isLoading.emit(true);
    this.uploadCount.set(fileList.length);

    try {
      const results: UploadResult[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const result = await this.service.uploadFile(file);
        results.push(result);
      }
      this.files.update((prev) => [...prev, ...results]);
      this.onChange(this.files().map((f) => f.key));
    } catch (err: any) {
      this.error.set(err.message || 'Falha ao enviar anexos.');
    } finally {
      this.isUploading.set(false);
      this.isLoading.emit(false);
      this.uploadCount.set(0);
      event.target.value = '';
    }
  }

  removeFile(key: string) {
    this.files.update((prev) => prev.filter((f) => f.key !== key));
    this.onChange(this.files().map((f) => f.key));
  }

  isImage(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
  }
}
