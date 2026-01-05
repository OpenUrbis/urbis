import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'permissionScope',
})
export class PermissionScopePipe implements PipeTransform {
  transform(value: string): string {
    const translates: any = {
      global: 'Global',
      any: 'Qualquer',
      own: 'Proprietário',
    };

    return translates[value] ?? 'Global';
  }
}
