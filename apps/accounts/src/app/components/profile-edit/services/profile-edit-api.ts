import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TUser } from '../../../shared/types/user';
import { environment } from '../../../../environments/environment';
import { IProfileData } from '../dto/profile-data.dto';

@Injectable({ providedIn: 'root' })
export class ProfileEditApi {
  private http = inject(HttpClient);

  patchMe(payload: IProfileData) {
    return this.http.patch<TUser>(`${environment.api}/auth/me`, payload);
  }
}
