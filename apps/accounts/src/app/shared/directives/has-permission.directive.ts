import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { PermissionState } from '../../states/permission/permission.state';
import { RolePermissionScopeEnum } from '../enums/role-permission-scope.enum';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private permissionState = inject(PermissionState);

  private permission: string | string[] = [];
  private scope: RolePermissionScopeEnum | string = RolePermissionScopeEnum.OWN;
  private mode: 'AND' | 'OR' = 'AND';
  private isHidden = true;

  @Input() set hasPermission(val: string | string[]) {
    this.permission = val;
    this.updateView();
  }

  @Input() set hasPermissionScope(val: RolePermissionScopeEnum | string) {
    this.scope = val;
    this.updateView();
  }

  @Input() set hasPermissionMode(val: 'AND' | 'OR') {
    this.mode = val;
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.permissionState.value(); // Establish dependency
      this.updateView();
    });
  }

  private updateView() {
    const hasPermission = this.permissionState.hasPermission(
      this.permission,
      this.mode,
      this.scope,
    );

    if (hasPermission && this.isHidden) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isHidden = false;
    } else if (!hasPermission && !this.isHidden) {
      this.viewContainer.clear();
      this.isHidden = true;
    }
  }
}
