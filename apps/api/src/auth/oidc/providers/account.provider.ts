export class AccountProvider {
  // Alterado para static arrow function
  static findAccount = async (_: any, id: string, authService: any) => {
    const user = await authService.me({ id });
    if (!user) return undefined;

    return {
      accountId: id,
      claims(_use: string, _scope: string) {
        return {
          sub: id,
          email: user.email,
          email_verified: true,
          name: `${user.firstName} ${user.lastName}`.trim(),
          given_name: user.firstName,
          family_name: user.lastName,
        };
      },
    };
  };

  // Alterado para static arrow function
  static loadExistingGrant = async (ctx: any) => {
    const grantId =
      ctx.oidc?.result?.consent?.grantId ||
      (ctx.oidc?.session?.grantIdFor && ctx.oidc?.client?.clientId
        ? ctx.oidc.session.grantIdFor(ctx.oidc.client.clientId)
        : undefined) ||
      ctx.oidc?.params?.grant_id;

    if (grantId) {
      const grant = await ctx.oidc.provider.Grant.find(grantId);
      if (grant) {
        return grant;
      }
    }

    const accountId =
      ctx.oidc?.session?.accountId ||
      ctx.oidc?.result?.login?.accountId ||
      ctx.oidc?.account?.accountId;

    if (accountId && ctx.oidc?.client?.clientId) {
      let grant;
      if (ctx.oidc?.session?.grantIdFor) {
        const existingGrantId = ctx.oidc.session.grantIdFor(
          ctx.oidc.client.clientId,
        );
        if (existingGrantId) {
          grant = await ctx.oidc.provider.Grant.find(existingGrantId);
        }
      }
      if (!grant) {
        grant = new ctx.oidc.provider.Grant({
          clientId: ctx.oidc.client.clientId,
          accountId: accountId,
        });
      }
      grant.addOIDCScope('openid profile email offline_access');
      await grant.save();
      return grant;
    }

    return undefined;
  };
}
