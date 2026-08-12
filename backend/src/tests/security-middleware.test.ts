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

  it('lets ENVIRONMENT=LOCAL turn off the secure flag for local http builds', () => {
    expect(getSessionCookieOptions('production', 'LOCAL').secure).toBe(false);
    // Allt annat än LOCAL ska behålla Secure — särskilt tomt/osatt, som är produktionsfallet.
    expect(getSessionCookieOptions('production', 'TEST').secure).toBe(true);
    expect(getSessionCookieOptions('production', '').secure).toBe(true);
    expect(getSessionCookieOptions('production', undefined).secure).toBe(true);
    // LOCAL får inte slå på Secure i en icke-produktionsmiljö.
    expect(getSessionCookieOptions('development', 'LOCAL').secure).toBe(false);
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
    if (typeof cookies[0] !== 'string') {
      throw new Error('Expected one persisted session cookie');
    }
    const cookie = cookies[0];

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
