import { RedisAdapter } from './redis.adapter';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Keygrip = require('keygrip');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Cookies = require('cookies');
import { AccountProvider } from '../providers/account.provider';

describe('OIDC RedisAdapter and Authentication Flow', () => {
  describe('RedisAdapter', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        get: jest.fn(),
        set: jest.fn(),
        hgetall: jest.fn(),
        hset: jest.fn(),
        expire: jest.fn(),
        del: jest.fn(),
        rpush: jest.fn(),
        ttl: jest.fn().mockResolvedValue(100),
        multi: jest.fn().mockReturnValue({
          del: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([]),
        }),
        lrange: jest.fn().mockResolvedValue([]),
      };
    });

    it('should upsert non-consumable payload correctly', async () => {
      const adapter = new RedisAdapter('Session', mockClient);
      const payload = { accountId: 'user-123', uid: 'session-uid' };

      await adapter.upsert('sess-id', payload, 3600);

      expect(mockClient.set).toHaveBeenCalledWith(
        'oidc:urbis:v3:Session:sess-id',
        JSON.stringify(payload),
      );
      expect(mockClient.expire).toHaveBeenCalledWith(
        'oidc:urbis:v3:Session:sess-id',
        3600,
      );
      expect(mockClient.set).toHaveBeenCalledWith(
        'oidc:urbis:v3:uid:session-uid',
        'sess-id',
        'EX',
        3600,
      );
    });

    it('should upsert consumable payload with hset and grant tracking', async () => {
      const adapter = new RedisAdapter('AuthorizationCode', mockClient);
      const payload = {
        accountId: 'user-123',
        grantId: 'grant-456',
        userCode: 'uc-789',
      };

      await adapter.upsert('code-id', payload, 60);

      expect(mockClient.hset).toHaveBeenCalledWith(
        'oidc:urbis:v3:AuthorizationCode:code-id',
        'payload',
        JSON.stringify(payload),
      );
      expect(mockClient.rpush).toHaveBeenCalledWith(
        'oidc:urbis:v3:grant:grant-456',
        'oidc:urbis:v3:AuthorizationCode:code-id',
      );
      expect(mockClient.set).toHaveBeenCalledWith(
        'oidc:urbis:v3:userCode:uc-789',
        'code-id',
        'EX',
        60,
      );
    });

    it('should find non-consumable payload', async () => {
      const adapter = new RedisAdapter('Interaction', mockClient);
      const payload = { uid: 'uuid-1', prompt: { name: 'login' } };
      mockClient.get.mockResolvedValue(JSON.stringify(payload));

      const result = await adapter.find('uuid-1');

      expect(result).toEqual(payload);
      expect(mockClient.get).toHaveBeenCalledWith(
        'oidc:urbis:v3:Interaction:uuid-1',
      );
    });

    it('should return undefined when key does not exist', async () => {
      const adapter = new RedisAdapter('Session', mockClient);
      mockClient.get.mockResolvedValue(null);

      const result = await adapter.find('non-existent');

      expect(result).toBeUndefined();
    });

    it('should find consumable payload and parse consumed timestamp as number', async () => {
      const adapter = new RedisAdapter('AuthorizationCode', mockClient);
      const payload = { accountId: 'user-1' };
      mockClient.hgetall.mockResolvedValue({
        payload: JSON.stringify(payload),
        consumed: '1725100000',
      });

      const result = await adapter.find('code-1');

      expect(result).toEqual({
        ...payload,
        consumed: 1725100000,
      });
    });

    it('should findByUid by resolving the uid pointer', async () => {
      const adapter = new RedisAdapter('Session', mockClient);
      const sessionPayload = { accountId: 'user-1', uid: 'uid-123' };
      mockClient.get
        .mockResolvedValueOnce('sess-real-id')
        .mockResolvedValueOnce(JSON.stringify(sessionPayload));

      const result = await adapter.findByUid('uid-123');

      expect(mockClient.get).toHaveBeenCalledWith('oidc:urbis:v3:uid:uid-123');
      expect(result).toEqual(sessionPayload);
    });

    it('should destroy a key correctly', async () => {
      const adapter = new RedisAdapter('Session', mockClient);
      await adapter.destroy('sess-1');

      expect(mockClient.del).toHaveBeenCalledWith(
        'oidc:urbis:v3:Session:sess-1',
      );
    });

    it('should revoke all tokens under a grantId', async () => {
      const adapter = new RedisAdapter('Grant', mockClient);
      mockClient.lrange.mockResolvedValue([
        'oidc:urbis:v3:AccessToken:token-1',
        'oidc:urbis:v3:RefreshToken:token-2',
      ]);

      await adapter.revokeByGrantId('grant-999');

      expect(mockClient.lrange).toHaveBeenCalledWith(
        'oidc:urbis:v3:grant:grant-999',
        0,
        -1,
      );
      expect(mockClient.multi).toHaveBeenCalled();
    });

    it('should consume a consumable model', async () => {
      const adapter = new RedisAdapter('AuthorizationCode', mockClient);
      await adapter.consume('code-1');

      expect(mockClient.hset).toHaveBeenCalledWith(
        'oidc:urbis:v3:AuthorizationCode:code-1',
        'consumed',
        expect.any(Number),
      );
    });
  });

  describe('Cookie Signing with Keygrip', () => {
    it('should generate valid signatures that Cookies.get(name, { signed: true }) can verify', () => {
      const secret = 'urbis-test-signing-secret';
      const uuid = 'test-interaction-uuid-12345';
      const keys = new Keygrip([secret]);

      const interactionSig = keys.sign('_interaction=' + uuid);
      const resumeSig = keys.sign('_interaction_resume=' + uuid);

      const req: any = {
        headers: {
          cookie: `_interaction=${uuid}; _interaction.sig=${interactionSig}; _interaction_resume=${uuid}; _interaction_resume.sig=${resumeSig}`,
        },
      };

      const cookies = new Cookies(req, {} as any, { keys: [secret] });

      expect(cookies.get('_interaction', { signed: true })).toBe(uuid);
      expect(cookies.get('_interaction_resume', { signed: true })).toBe(uuid);
    });
  });

  describe('AccountProvider.loadExistingGrant', () => {
    it('should reuse existing grant when found', async () => {
      const mockGrant = {
        jti: 'grant-123',
        accountId: 'user-1',
        addOIDCScope: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      const ctx: any = {
        oidc: {
          params: { grant_id: 'grant-123' },
          provider: {
            Grant: {
              find: jest.fn().mockResolvedValue(mockGrant),
            },
          },
        },
      };

      const result = await AccountProvider.loadExistingGrant(ctx);
      expect(result).toBe(mockGrant);
    });

    it('should fallback to creating a grant if grantId is not found', async () => {
      const mockGrantInstance = {
        addOIDCScope: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      const ctx: any = {
        oidc: {
          params: { grant_id: 'grant-old-expired' },
          session: { accountId: 'user-1' },
          client: { clientId: 'client-map' },
          provider: {
            Grant: Object.assign(
              jest.fn().mockImplementation(() => mockGrantInstance),
              {
                find: jest.fn().mockResolvedValue(undefined),
              },
            ),
          },
        },
      };

      const result = await AccountProvider.loadExistingGrant(ctx);
      expect(result).toBe(mockGrantInstance);
      expect(mockGrantInstance.addOIDCScope).toHaveBeenCalledWith(
        'openid profile email offline_access',
      );
      expect(mockGrantInstance.save).toHaveBeenCalled();
    });
  });
});
