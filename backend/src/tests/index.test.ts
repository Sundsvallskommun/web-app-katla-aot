import { IndexController } from '@controllers/index.controller';
import { localApi } from '@utils/util';
import request from 'supertest';
import { afterAll, describe, it } from 'vitest';

import App from '@/app';

afterAll(async () => {
  await new Promise<void>(resolve =>
    setTimeout(() => {
      resolve();
    }, 500),
  );
});
describe('Testing Index', () => {
  describe('[GET] /', () => {
    it('response statusCode 200', () => {
      const app = new App([IndexController]);
      return request(app.getServer()).get(localApi('/')).expect(200);
    });
  });
});
