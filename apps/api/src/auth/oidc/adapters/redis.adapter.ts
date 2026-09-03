import Redis from 'ioredis';

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
]);

const consumable = new Set([
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
]);

function isEmptyData(data: any): boolean {
  if (!data) return true;
  if (typeof data === 'object') {
    return Object.keys(data).length === 0;
  }
  return false;
}

function grantKeyFor(id: string) {
  return `oidc:urbis:v3:grant:${id}`;
}

function userCodeKeyFor(userCode: string) {
  return `oidc:urbis:v3:userCode:${userCode}`;
}

function uidKeyFor(uid: string) {
  return `oidc:urbis:v3:uid:${uid}`;
}

export class RedisAdapter {
  name: string;
  client: Redis;

  constructor(name: string, client: Redis) {
    this.name = name;
    this.client = client;
  }

  async upsert(id: string, payload: any, expiresIn: number) {
    const key = this.key(id);

    try {
      if (consumable.has(this.name)) {
        await this.client.hset(key, 'payload', JSON.stringify(payload));
      } else {
        await this.client.set(key, JSON.stringify(payload));
      }

      if (expiresIn) {
        await this.client.expire(key, expiresIn);
      }

      if (grantable.has(this.name) && payload.grantId) {
        const grantKey = grantKeyFor(payload.grantId as string);
        await this.client.rpush(grantKey, key);
        const ttl = await this.client.ttl(grantKey);
        if (expiresIn > ttl) {
          await this.client.expire(grantKey, expiresIn);
        }
      }

      if (payload.userCode) {
        const userCodeKey = userCodeKeyFor(payload.userCode as string);
        await this.client.set(userCodeKey, id, 'EX', expiresIn || 600);
      }

      if (payload.uid) {
        const uidKey = uidKeyFor(payload.uid as string);
        await this.client.set(uidKey, id, 'EX', expiresIn || 600);
      }
    } catch (e) {
      console.error(`RedisAdapter.upsert error for ${this.name}:${id}`, e);
      throw e;
    }
  }

  async find(id: string) {
    try {
      const data = consumable.has(this.name)
        ? await this.client.hgetall(this.key(id))
        : await this.client.get(this.key(id));

      if (isEmptyData(data)) {
        return undefined;
      }

      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      const { payload, ...rest } = data as Record<string, any>;
      if (rest.consumed) {
        rest.consumed = Number(rest.consumed);
      }
      if (!payload) {
        return rest;
      }
      return {
        ...rest,
        ...JSON.parse(payload as string),
      };
    } catch (e) {
      console.error(`RedisAdapter.find error for ${this.name}:${id}`, e);
      return undefined;
    }
  }

  async findByUid(uid: string) {
    const id = await this.client.get(uidKeyFor(uid));
    if (!id) return undefined;
    return this.find(id);
  }

  async findByUserCode(userCode: string) {
    const id = await this.client.get(userCodeKeyFor(userCode));
    if (!id) return undefined;
    return this.find(id);
  }

  async destroy(id: string) {
    if (!id) return;
    try {
      const key = this.key(id);
      await this.client.del(key);
    } catch (e) {
      console.error(`RedisAdapter.destroy error for ${this.name}:${id}`, e);
    }
  }

  async revokeByGrantId(grantId: string) {
    if (!grantId) return;
    try {
      const multi = this.client.multi();
      const tokens = await this.client.lrange(grantKeyFor(grantId), 0, -1);
      tokens.forEach((token) => multi.del(token));
      multi.del(grantKeyFor(grantId));
      await multi.exec();
    } catch (e) {
      console.error(
        `RedisAdapter.revokeByGrantId error for grant:${grantId}`,
        e,
      );
    }
  }

  async consume(id: string) {
    try {
      await this.client.hset(
        this.key(id),
        'consumed',
        Math.floor(Date.now() / 1000),
      );
    } catch (e) {
      console.error(`RedisAdapter.consume error for ${this.name}:${id}`, e);
    }
  }

  key(id: string) {
    return `oidc:urbis:v3:${this.name}:${id}`;
  }
}
