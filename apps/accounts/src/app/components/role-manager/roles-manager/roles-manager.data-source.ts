import { Injectable } from '@angular/core';
import { AbstractDataSource } from '../../../../../projects/shared/src/lib/model/abstract-data-source';
import { environment } from '../../../../environments/environment';
import { IRoleResponse } from '../dto/role.dto';

@Injectable({ providedIn: 'root' })
export class RolesManagerDataSource extends AbstractDataSource<IRoleResponse> {
  protected baseUrl: string = `${environment.api}/role/list`;

  constructor() {
    // Define as opções para a classe mãe
    super({
      initialParams: {
        limit: 15,
        sortBy: 'name',
        sortDirection: 'asc',
      },
    });
  }
}
