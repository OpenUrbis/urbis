import { userManager } from "../auth/oidc-config";

const buildAuthHeaders = (accessToken: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const orgByLocalStorage =
    typeof window !== "undefined"
      ? localStorage.getItem("organization-seleted")
      : null;
  if (orgByLocalStorage && orgByLocalStorage !== "undefined") {
    try {
      const org = JSON.parse(orgByLocalStorage);
      const organizationId =
        typeof org === "string" ? org : org?.id || org?.organizationId;
      if (organizationId) {
        headers["x-organization-id"] = organizationId;
      }
    } catch {
      // Some integrations persist the ID directly instead of a JSON object.
      headers["x-organization-id"] = orgByLocalStorage;
    }
  }

  return headers;
};

export const getAuthHeaders = async () => {
  const user = await userManager.getUser();
  if (!user || user.expired) {
    await userManager.signinRedirect();
    throw new Error("User not authenticated, redirecting...");
  }

  return buildAuthHeaders(user.access_token);
};

export const getOptionalAuthHeaders = async () => {
  try {
    const user = await userManager.getUser();
    return user && !user.expired && user.access_token
      ? buildAuthHeaders(user.access_token)
      : {};
  } catch {
    return {};
  }
};
