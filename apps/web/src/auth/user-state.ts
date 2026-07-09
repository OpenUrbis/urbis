import { computed, signal } from '@preact/signals';
import {
  AccessControl,
  IAccessControlPermission,
} from '../utils/access-control';

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  position?: string;
  [key: string]: any;
}

export const userProfile = signal<UserProfile | null>(null);
export const userPermissions = signal<IAccessControlPermission[]>([]);

export const accessControl = computed(
  () => new AccessControl(userPermissions.value),
);
