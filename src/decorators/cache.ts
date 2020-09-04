import { LocalCache } from '../cache/LocalCache';
import { RedisCache } from '../cache/RedisCache';
import 'reflect-metadata';
export type CacheDriverType = 'local' | 'redis';
const createCacheHandler = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  fun: Function,
  type: 'local' | 'redis',
  expire: number = Number.MAX_SAFE_INTEGER,
) => {
  return (...args: any[]) => {
    const fname = Reflect.getMetadata('cacheName', fun);
    const key = `${fname}_${args.length > 0 ? args.join('_') : ['void']}`;
    const pkey = `${key}_#PROMISE`;
    if (type === 'local') {
      let result = LocalCache.instance.get(pkey);
      if (result) {
        return  Promise.resolve(result);
      }
      result = LocalCache.instance.get(key);
      if (result) {
        return result;
      }
      const _r = fun(...args);
      if (_r instanceof Promise) {
        return _r.then((_res) => {
          LocalCache.instance.set(pkey, _res, expire);
          return _res;
        });
      }
      LocalCache.instance.set(key, _r, expire);
      return _r;
    }
    if (type === 'redis') {
      return RedisCache.instance.get(key).then((result) => {
        if (!result) {
          const _rp = fun(...args);
          if (_rp instanceof Promise) {
            return _rp.then((_r) => {
              RedisCache.instance.set(key, _r, expire);
              return _r;
            });
          }
          throw new Error(
            `if driver is 'redis' then function must return as a Promise!`,
          );
        }
        return result;
      });
    }
    return null;
  };
};
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const Cache = <T extends CacheDriverType = 'local'>(
  driver: T,
  expire?: number,
) => {
  const local = LocalCache.instance;
  return (
    target: any,
    prop: string,
    reciver?: TypedPropertyDescriptor<
      T extends 'redis'
        ? (...args: any[]) => Promise<any>
        : (...args: any[]) => any
    >,
  ) => {
    let key: string;
    switch (typeof target) {
      case 'object':
        // eslint-disable-next-line @typescript-eslint/ban-types
        key = `${(target as Object).constructor.name}_${prop}`;
        break;
      case 'function':
        key = `${target.name}_${prop}`;
        break;
      default:
        key = `${(target || 'void').toString()}_${prop}`;
        break;
    }
    if (reciver) {
      const value = reciver.value;
      value.bind(target);
      Reflect.defineMetadata('cacheName', key, value);
      reciver.value = createCacheHandler(value, driver, expire) as any;
      return reciver as any;
    }
    Reflect.defineProperty(target, prop, {
      get: () => {
        const fkey = `${key}_#FUN`;
        let value = local.get(fkey);
        if (value) return value;
        value = local.get(key);
        if (value instanceof Function) {
          value = createCacheHandler(value, driver, expire);
          Reflect.defineMetadata('cacheName', fkey, value);
          local.set(fkey, value);
        }
        return value;
      },
      set: (value) => {
        Reflect.defineMetadata('cacheName', key, value);
        return local.set(key, value);
      },
    });
  };
};
