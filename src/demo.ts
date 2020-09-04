import { Cache } from './decorators/cache';
import { RedisCache } from './cache/RedisCache';
import { RedisWrap } from './redisWrap';

RedisCache.setRedis(
  RedisWrap.create({ host: '10.0.100.1', auth_pass: 'aabbcc' }),
);
export class test {
  @Cache('local', 1000)
  bb(): Promise<string> {
    return Promise.resolve('set');
  }
  @Cache('redis', 1000)
  ttt = (): Promise<number> => {
    return Promise.resolve(321);
  };
}
const x = new test();
x.bb().then((i)=>{
  x.bb()
})
