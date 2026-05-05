import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { userPermissions, userProfile } from './user-state';

export const UserSync = () => {
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      console.log(auth);
      userProfile.value = {
        id: auth.user.profile.sub,
        name: auth.user.profile.name,
        email: auth.user.profile.email,
        ...auth.user.profile,
      };

      fetch(`${import.meta.env.VITE_API_URL}/auth/permissions`, {
        headers: {
          Authorization: `Bearer ${auth.user.access_token}`,
        },
      })
        .then((res) => res.json())
        .then((permissions) => {
          userPermissions.value = permissions;
        })
        .catch((err) => {
          console.error('Failed to fetch permissions', err);
          userPermissions.value = [];
        });
    } else {
      userProfile.value = null;
      userPermissions.value = [];
    }
  }, [auth.isAuthenticated, auth.user]);

  return null;
};
