import * as redis from 'redis';

export type Wrap<T = redis.RedisClient> = {
  [K in keyof T]: T[K] extends (
    ...args: [infer P, redis.Callback<infer X>]
  ) => any
    ? (args: P) => Promise<X>
    : T[K] extends (
        ...args: [infer P1, infer P2, redis.Callback<infer R>]
      ) => any
    ? (p1: P1, p2: P2) => Promise<R>
    : T[K] extends (
        ...args: [infer P1, infer P2, infer P3, redis.Callback<infer R>]
      ) => any
    ? (...args: [P1, P2, P3]) => Promise<R>
    : T[K] extends (
        ...args: [
          infer P1,
          infer P2,
          infer P3,
          infer P4,
          redis.Callback<infer R>,
        ]
      ) => any
    ? (...args: [P1, P2, P3, P4]) => Promise<R>
    : T[K];
};
export type RedisWrapClient = Omit<Wrap, 'hmset' | 'HMSET'> & {
  hmset: <T extends string | number = string>(
    name: string,
    fst: T,
    ...args: T[]
  ) => Promise<'OK'>;
  HMSET: RedisWrapClient['hset'];
};

export class RedisWrap {
  private static instance: redis.RedisClient;
  private static proxy: Wrap;
  private static map: Map<any, any> = new Map();
  private static build = <T = typeof redis>(handler: T[keyof T]) => {
    if (typeof handler !== 'function') {
      return handler;
    }
    let cache = RedisWrap.map.get(handler);
    if (!cache) {
      cache = async (...args: any[]) => {
        return new Promise((resolve, reject) => {
          handler.bind(RedisWrap.instance)(
            ...args,
            (error: Error | null, result: any) =>
              error ? reject(error) : resolve(result),
          );
        });
      };
      RedisWrap.map.set(handler, cache);
    }
    return cache;
  };
  static create = (opt: redis.ClientOpts): RedisWrapClient => {
    RedisWrap.instance = RedisWrap.instance
      ? RedisWrap.instance
      : redis.createClient(opt);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    RedisWrap.proxy = RedisWrap.proxy
      ? RedisWrap.proxy
      : new Proxy(RedisWrap.instance, {
          get: (_, name) => {
            return RedisWrap.build(RedisWrap.instance[name]);
          },
        });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    return RedisWrap.proxy as RedisWrapClient;
  };
}
