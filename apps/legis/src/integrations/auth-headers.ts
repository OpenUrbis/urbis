import { userManager } from '@/auth/oidc-config';

export async function getAccessToken(): Promise<string | undefined> {
  const user = await userManager.getUser();

  if (!user || user.expired || !user.access_token) {
    return undefined;
  }

  return user.access_token;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function requireAuthHeaders(): Promise<Record<string, string>> {
  const headers = await getAuthHeaders();

  if (!headers.Authorization) {
    throw new Error('Authentication required');
  }

  return headers;
}