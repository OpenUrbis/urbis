import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { environment } from '../../../../../../../src/environments/environment';

export enum UploadStrategyPathEnum {
  AVATAR = 'avatar',
  LOGOTYPE = 'logotype',
  LOGOMARK = 'logomark',
}

export interface UploadQueryDto {
  organizationId?: string;
  theme?: 'light' | 'dark';
}

export interface IGetUrlSignedParams {
  contentType: string;
  strategy: UploadStrategyPathEnum;
  parameters?: UploadQueryDto;
}

export interface IResponseGetUrlSigned {
  uploadURL: string;
  key: string;
  contentType: string;
  urlFile: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploaderApi {
  constructor(private readonly http: HttpClient) {}

  getUploadUrl(data: IGetUrlSignedParams): Observable<IResponseGetUrlSigned> {
    let params = new HttpParams();

    if (data.parameters) {
      Object.keys(data.parameters).forEach((key) => {
        const value = data.parameters![key as keyof UploadQueryDto];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.put<IResponseGetUrlSigned>(
      `${environment.api}/files/upload-url`,
      data,
      { params },
    );
  }

  sendFile(uploadUrl: string, blob: any, contentType: string) {
    return this.http.put(uploadUrl, blob, {
      reportProgress: true,
      headers: {
        'content-type': contentType,
        'Access-Control-Allow-Origin': '*',
        DISABLE_INTERCEPTORS: 'true',
      },
    });
  }

  upload(
    data: IGetUrlSignedParams,
    blob: any,
  ): Observable<IResponseGetUrlSigned> {
    return this.getUploadUrl(data).pipe(
      switchMap((result) => {
        const { uploadURL, contentType } = result;
        console.log(result);
        return this.sendFile(uploadURL, blob, contentType).pipe(
          map(() => result),
        );
      }),
    );
  }
}
