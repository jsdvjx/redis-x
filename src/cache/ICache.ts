export interface ICacheDriver {
  get: <R = any>(key: string) => R | Promise<R>;
  set: <T = any>(key: string, value: T, expire?: number) => void;
}
