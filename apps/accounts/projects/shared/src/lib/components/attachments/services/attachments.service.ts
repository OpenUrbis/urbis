import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../../../src/environments/environment';

export interface UploadResult {
  key: string;
  url: string;
  name: string;
}

@Injectable()
export class AttachmentsService {
  private http = inject(HttpClient);
  private recaptcha = inject(ReCaptchaV3Service);

  async uploadFile(file: File): Promise<UploadResult> {
    const uploadToken = await firstValueFrom(
      this.recaptcha.execute('upload_file'),
    );

    const contentType = file.type || 'application/octet-stream';
    const folderPath = 'solicitations/anexos';
    const uploadInfo: any = await firstValueFrom(
      this.http.post(`${environment.api}/files/public/upload-url`, {
        contentType,
        folderPath,
        recaptcha: uploadToken,
      }),
    );

    await this.uploadToS3(uploadInfo, file);

    const downloadToken = await firstValueFrom(
      this.recaptcha.execute('download_url'),
    );

    const downloadUrl: any = await firstValueFrom(
      this.http.get(`${environment.api}/files/public/download-url`, {
        params: {
          key: uploadInfo.key,
        },
        headers: {
          recaptcha: downloadToken,
        },
        responseType: 'json',
      }),
    );

    const url = downloadUrl.downloadURL || downloadUrl.url || downloadUrl;

    return {
      key: uploadInfo.key,
      url: url,
      name: file.name,
    };
  }

  private async uploadToS3(uploadInfo: any, file: File) {
    if (uploadInfo.fields) {
      const formData = new FormData();
      Object.keys(uploadInfo.fields).forEach((k) => {
        formData.append(k, uploadInfo.fields[k]);
      });
      formData.append('file', file);
      await fetch(uploadInfo.uploadURL, {
        method: 'POST',
        body: formData,
      });
    } else {
      await fetch(uploadInfo.uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
        },
      });
    }
  }

  async getDownloadUrl(key: string): Promise<string> {
    const downloadToken = await firstValueFrom(
      this.recaptcha.execute('download_url'),
    );
    const res: any = await firstValueFrom(
      this.http.get(`${environment.api}/files/public/download-url`, {
        params: { key },
        headers: { recaptcha: downloadToken },
        responseType: 'json',
      }),
    );
    return res.downloadURL || res.url || res;
  }
}
