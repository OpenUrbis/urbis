import { generateKeyPairSync } from 'crypto';

/**
 * Loads OIDC JWKS configuration.
 * In production, keys must be provided via the OIDC_JWKS or AUTH_JWKS environment variable.
 */
export const getJwks = () => {
  const envJwks = process.env.OIDC_JWKS || process.env.AUTH_JWKS;
  if (envJwks) {
    try {
      return typeof envJwks === 'string' ? JSON.parse(envJwks) : envJwks;
    } catch (error) {
      console.error('Failed to parse OIDC_JWKS/AUTH_JWKS:', error);
      throw new Error(
        'Invalid OIDC_JWKS/AUTH_JWKS configuration; provide valid JSON.',
      );
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    throw new Error(
      'OIDC_JWKS or AUTH_JWKS must be configured outside development.',
    );
  }

  // Generate a valid ephemeral key for local development only. The OIDC provider
  // requires RS256 keys with a modulus of at least 2048 bits.
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicExponent: 0x10001,
  });
  const privateJwk = privateKey.export({ format: 'jwk' });

  return {
    keys: [
      {
        ...privateJwk,
        use: 'sig',
        alg: 'RS256',
        kid: 'dev-key',
      },
    ],
  };
};

export const jwks = getJwks();
