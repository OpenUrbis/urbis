import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { IProfileData } from '../dto/profile-data.dto';
import { IUser } from '../../../pages/users/dto/user.dto';

@Injectable({ providedIn: 'root' })
export class ProfileEditApi {
  private http = inject(HttpClient);

  patchMe(payload: IProfileData) {
    return this.http.patch<IUser>(`${environment.api}/auth/me`, payload);
  }
}
