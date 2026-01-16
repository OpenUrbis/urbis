import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { EditProfileAvatarComponent } from './components/edit-profile-avatar';
import { UserAvatarComponent } from '../user-avatar/user-avatar';
import { ProfileState } from '../../states/profile/profile.state';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile-avatar',
  imports: [CommonModule, UserAvatarComponent, EditProfileAvatarComponent],
  templateUrl: './profile-avatar.html',
})
export class ProfileAvatarComponent {
  private readonly profileState = inject(ProfileState);
  protected readonly firstName = computed(
    () => this.profileState.value().firstName ?? 'John',
  );
  protected readonly lastName = computed(
    () => this.profileState.value().lastName ?? 'Doe',
  );

  readonly avatarSrc = computed(() => {
    const profile = this.profileState.value();

    return `${environment.s3EndpointPublic}/avatars/${profile.id}`;
  });
  canEdit = input(true);
  size = input(120);
}
