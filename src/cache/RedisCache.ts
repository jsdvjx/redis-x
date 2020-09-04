import { ICacheDriver } from './ICache';
import { RedisWrapClient } from '../redisWrap';
type RedisCachePack = {
  value: any;
};
export class RedisCache implements ICacheDriver {
  private constructor() {
    return;
  }
  get: <R = any>(key: string) => Promise<R> = (key: string) => {
    return RedisCache.redis
      .get(key)
      .then((i) => {
        return i;
      })
      .then((str) => JSON.parse(str) as RedisCachePack)
      .then((res) => res.value) as Promise<any>;
  };
  set: <T = any>(key: string, value: T, expire?: number) => void = (
    key,
    value,
    expire,
  ) => {
    RedisCache.redis.set(key, JSON.stringify({ value }));
    if (expire !== Number.MAX_SAFE_INTEGER)
      RedisCache.redis.expire(key, expire);
  };
  private static redis: RedisWrapClient;
  static setRedis = (redis: RedisWrapClient): void => {
    RedisCache.redis = redis;
  };
  static instance: RedisCache = new RedisCache();
}
