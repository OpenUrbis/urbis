import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'permissionScope',
})
export class PermissionScopePipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(value: string): string {
    const key = `pages.roles.form.scopeOptions.${value}`;
    const translated = this.translate.instant(key);

    return translated || this.translate.instant('pages.roles.form.scopeOptions.global');
  }
}
