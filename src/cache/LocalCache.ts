import { ICacheDriver } from './ICache';
import * as dayjs from 'dayjs';
type LocalCachePack = {
  value: any;
  expire: number;
  created_at: dayjs.Dayjs;
};
export class LocalCache implements ICacheDriver {
  private map: Record<string, LocalCachePack> = {};
  private constructor() {
    return;
  }
  get: <R = any>(key: string) => R = (key: string) => {
    const now = dayjs();
    const pack = this.map[key];
    if (!pack) return null;
    if (
      Number.MAX_SAFE_INTEGER === pack.expire ||
      pack.created_at.valueOf() + (pack.expire*1000) >= now.valueOf()
    ) {
      return pack.value;
    }
    delete this.map[key];
    return null;
  };
  set: <T = any>(key: string, value: T, expire?: number) => void = (
    key,
    value,
    expire?: number,
  ) => {
    this.map[key] = {
      value,
      expire: expire || Number.MAX_SAFE_INTEGER,
      created_at: dayjs(),
    };
  };
  static instance: LocalCache = new LocalCache();
}
