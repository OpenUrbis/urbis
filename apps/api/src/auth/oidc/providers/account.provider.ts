export class AccountProvider {
  // Alterado para static arrow function
  static findAccount = (_: any, id: any) => {
    return {
      accountId: id,
      claims() {
        return {
          sub: id,
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
    grant.addOIDCScope('openid profile offline_access');
    await grant.save();
    return grant;
  };
}
