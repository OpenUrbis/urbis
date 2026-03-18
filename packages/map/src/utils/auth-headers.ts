import { userManager } from "../auth/oidc-config";

export const getAuthHeaders = async () => {
  const user = await userManager.getUser();
  if (!user || user.expired) {
    await userManager.signinRedirect();
    throw new Error("User not authenticated, redirecting...");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.access_token}`,
  };
};
