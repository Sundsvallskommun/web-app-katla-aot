import express from 'express';
import passport from 'passport';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { IndexController } from '@/controllers/index.controller';

type SamlAuthenticationCallback = (error: unknown, user?: Express.User | false | null) => void;

const mockSamlAuthentication = (error: unknown, user?: Express.User | false | null, loginError?: Error): void => {
  vi.spyOn(passport, 'authenticate').mockImplementation(((_strategy: string, optionsOrCallback?: unknown) => {
    if (typeof optionsOrCallback !== 'function') {
      return (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
        next();
      };
    }

    const callback = optionsOrCallback as SamlAuthenticationCallback;
    return (req: express.Request) => {
      if (loginError) {
        Object.defineProperty(req, 'login', {
          configurable: true,
          value: (_user: Express.User, done: (loginResult?: unknown) => void) => {
            done(loginError);
          },
        });
      }
      callback(error, user);
    };
  }) as typeof passport.authenticate);
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SAML callback redirects', () => {
  it('uses the configured fallback when RelayState is missing', async () => {
    mockSamlAuthentication({ name: 'SAML_INVALID_RESPONSE' });
    const app = new App([IndexController]).getServer();

    const response = await request(app).post('/api/saml/login/callback').type('form').send({}).expect(302);

    expect(response.headers.location).toBe('http://localhost:3000/?failMessage=SAML_INVALID_RESPONSE');
  });

  it('rejects an untrusted success redirect while preserving an allowed failure redirect', async () => {
    mockSamlAuthentication(undefined, false);
    const app = new App([IndexController]).getServer();

    const response = await request(app)
      .post('/api/saml/login/callback')
      .type('form')
      .send({ RelayState: 'https://evil.example/success,http://localhost:3000/failure' })
      .expect(302);

    expect(response.headers.location).toBe('http://localhost:3000/failure?failMessage=NO_USER');
  });

  it('redirects exactly once when req.login fails', async () => {
    mockSamlAuthentication(undefined, {}, new Error('login failed'));
    const redirectSpy = vi.spyOn(express.response, 'redirect');
    const app = new App([IndexController]).getServer();

    const response = await request(app)
      .post('/api/saml/login/callback')
      .type('form')
      .send({ RelayState: 'http://localhost:3000/success,http://localhost:3000/failure' })
      .expect(302);

    expect(response.headers.location).toBe('http://localhost:3000/failure?failMessage=SAML_UNKNOWN_ERROR');
    expect(redirectSpy.mock.calls).toHaveLength(1);
  });

  it('uses the success redirect for logout unless the session contains a real failure message', async () => {
    const app = new App([IndexController]).getServer();

    const successResponse = await request(app)
      .get('/api/saml/logout/callback')
      .type('form')
      .send({ RelayState: 'http://localhost:3000/success,http://localhost:3000/failure' })
      .expect(302);

    expect(successResponse.headers.location).toBe('http://localhost:3000/success');

    app.get('/api/seed-saml-error', (req, res) => {
      req.session.messages = ['SAML_LOGOUT_FAILED'];
      res.sendStatus(204);
    });
    const agent = request.agent(app);
    await agent.get('/api/seed-saml-error').expect(204);

    const failureResponse = await agent
      .get('/api/saml/logout/callback')
      .type('form')
      .send({ RelayState: 'http://localhost:3000/success,http://localhost:3000/failure' })
      .expect(302);

    expect(failureResponse.headers.location).toBe('http://localhost:3000/failure?failMessage=SAML_LOGOUT_FAILED');
  });
});
