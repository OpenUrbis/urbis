/**
 * Loads OIDC JWKS configuration.
 * In production, keys must be provided via the OIDC_JWKS or AUTH_JWKS environment variable.
 */
export const getJwks = () => {
  const envJwks = process.env.OIDC_JWKS || process.env.AUTH_JWKS;
  if (envJwks) {
    try {
      return typeof envJwks === 'string' ? JSON.parse(envJwks) : envJwks;
    } catch (e) {
      console.error('Failed to parse OIDC_JWKS environment variable:', e);
    }
  }

  // Development dummy key structure for local testing
  return {
    keys: [
      {
        kty: 'RSA',
        e: 'AQAB',
        use: 'sig',
        alg: 'RS256',
        kid: 'dev-key',
        n: 'sX8_dev_key_dummy_n',
        d: 'sX8_dev_key_dummy_d',
        p: 'sX8_dev_key_dummy_p',
        q: 'sX8_dev_key_dummy_q',
        dp: 'sX8_dev_key_dummy_dp',
        dq: 'sX8_dev_key_dummy_dq',
        qi: 'sX8_dev_key_dummy_qi',
      },
    ],
  };
};

export const jwks = getJwks();
