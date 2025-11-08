import { FormGroup } from '@angular/forms';

export function mergeFormGroups(...groups: FormGroup[]): FormGroup {
  const controls: any = {};
  const validators: any[] = [];

  groups.forEach((group) => {
    Object.keys(group.controls).forEach((key) => {
      controls[key] = group.get(key);
    });
    if (group.validator) {
      validators.push(group.validator);
    }
  });

  return new FormGroup(controls, validators);
}
