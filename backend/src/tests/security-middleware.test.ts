import request from 'supertest';
import { describe, expect, it } from 'vitest';

import App, { getSessionCookieOptions } from '@/app';
import { IndexController } from '@/controllers/index.controller';
import { localApi } from '@/utils/util';

describe('security middleware', () => {
  it('uses secure session cookies in production', () => {
    expect(getSessionCookieOptions('production')).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
    expect(getSessionCookieOptions('test').secure).toBe(false);
  });

  it('sets hardened attributes on a persisted session cookie', async () => {
    const app = new App([IndexController]).getServer();
    app.get('/session-test', (req, res) => {
      req.session.returnTo = '/';
      res.sendStatus(204);
    });

    const response = await request(app).get('/session-test').expect(204);
    const cookies = response.headers['set-cookie'];
    if (!Array.isArray(cookies)) {
      throw new Error('Expected one persisted session cookie');
    }
    const cookie = cookies.at(0);
    if (cookie === undefined) {
      throw new Error('Expected one persisted session cookie');
    }

    expect(cookies).toHaveLength(1);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('publishes standard rate-limit headers without legacy headers', async () => {
    const app = new App([IndexController]);
    const response = await request(app.getServer()).get(localApi('/')).expect(200);

    expect(response.headers['ratelimit-policy']).toContain('1000;w=900');
    expect(response.headers['ratelimit-limit']).toBe('1000');
    expect(response.headers['x-ratelimit-limit']).toBeUndefined();
  });
});
