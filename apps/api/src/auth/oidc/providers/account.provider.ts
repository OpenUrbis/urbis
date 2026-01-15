export class AccountProvider {
  // Alterado para static arrow function
  static findAccount = async (_: any, id: string, authService: any) => {
    const user = await authService.me({ id });
    if (!user) return undefined;

    return {
      accountId: id,
      async claims(use: string, scope: string) {
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
    // Certifique-se que o 'ctx' tem o tipo correto (ou use 'any' para simplificar localmente)
    const grant = new ctx.oidc.provider.Grant({
      clientId: ctx.oidc.client.clientId,
      accountId: ctx.oidc.session.accountId,
    });
    grant.addOIDCScope('openid profile email offline_access');
    await grant.save();
    return grant;
  };
}
