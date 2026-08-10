import App, { getSessionCookieOptions } from '@/app';
import { IndexController } from '@/controllers/index.controller';
import { localApi } from '@/utils/util';
import request from 'supertest';

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

    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Lax');
  });

  it('publishes standard rate-limit headers without legacy headers', async () => {
    const app = new App([IndexController]);
    const response = await request(app.getServer()).get(localApi('/')).expect(200);

    expect(response.headers['ratelimit-policy']).toContain('6000;w=900');
    expect(response.headers['ratelimit-limit']).toBe('6000');
    expect(response.headers['x-ratelimit-limit']).toBeUndefined();
  });
});
