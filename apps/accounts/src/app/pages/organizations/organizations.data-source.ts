import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AbstractDataSource } from '../../../../projects/shared/src/lib/model/abstract-data-source'; // Assumindo que o arquivo está no mesmo diretório
import { environment } from '../../../environments/environment';
import { IOrganization } from './dto/organization.dto';

@Injectable({ providedIn: 'root' })
export class OrganizationDataSource extends AbstractDataSource<IOrganization> {
  protected baseUrl: string = `${environment.api}/organization`;

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
