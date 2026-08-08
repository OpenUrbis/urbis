import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { AbstractDataSource } from '../../../../projects/shared/src/lib/model/abstract-data-source'; // Assumindo que o arquivo está no mesmo diretório
import { environment } from '../../../environments/environment';
import { IUser } from './dto/user.dto';

@Injectable({ providedIn: 'root' })
export class UserDataSource extends AbstractDataSource<
  IUser,
  { organizationId: AbstractControl; status: AbstractControl }
> {
  protected baseUrl: string = `${environment.api}/user`;

  constructor() {
    // Define as opções para a classe mãe
    super({
      initialParams: {
        limit: 15,
        sortBy: 'name',
        sortDirection: 'asc',
      },
      filterFormGroup: new FormGroup({
        organizationId: new FormControl(),
        status: new FormControl(),
      }),
    });
  }
}
