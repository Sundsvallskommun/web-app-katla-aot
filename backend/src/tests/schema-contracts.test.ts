import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { SchemaController } from '@/controllers/schema.controller';
import { HttpException } from '@/exceptions/HttpException';
import ApiService from '@/services/api.service';

vi.mock('@/middlewares/auth.middleware', () => ({
  default: (req: Request, _res: Response, next: NextFunction) => {
    Object.defineProperty(req, 'user', {
      configurable: true,
      value: {
        username: 'test-user',
        name: 'Test User',
        givenName: 'Test',
        surname: 'User',
      },
    });
    next();
  },
}));

const app = new App([SchemaController]).getServer();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('JSON schema adapter contracts', () => {
  it('returns the immutable requested ID and typed schema response for an exact version', async () => {
    const getSpy = vi
      .spyOn(ApiService.prototype, 'get')
      .mockResolvedValueOnce({ data: { id: 'schema-v1', value: { type: 'object' } }, message: 'success' })
      .mockResolvedValueOnce({ data: { value: { 'ui:order': ['name'] } }, message: 'success' });

    const response = await request(app).get('/api/schemas/schema-v1').expect(200);

    expect(response.body).toEqual({
      schema: { type: 'object' },
      uiSchema: { 'ui:order': ['name'] },
      schemaId: 'schema-v1',
    });
    expect(getSpy.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ url: '2281/schemas/schema-v1' }));
  });

  it('fails closed when the exact endpoint returns a different schema ID', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({
      data: { id: 'different-id', value: { type: 'object' } },
      message: 'success',
    });

    const response = await request(app).get('/api/schemas/schema-v1').expect(502);

    expect(response.body).toEqual({ message: 'Invalid JSON schema response: schema id does not match request' });
  });

  it('fails closed when the exact endpoint omits its schema ID', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({
      data: { value: { type: 'object' } },
      message: 'success',
    });

    const response = await request(app).get('/api/schemas/schema-v1').expect(502);

    expect(response.body).toEqual({ message: 'Invalid JSON schema response: missing schema id' });
  });

  it('returns the upstream immutable ID for a latest schema and uses it for UI schema lookup', async () => {
    const getSpy = vi
      .spyOn(ApiService.prototype, 'get')
      .mockResolvedValueOnce({ data: { id: 'latest-schema-v2', value: { type: 'object' } }, message: 'success' })
      .mockResolvedValueOnce({ data: { value: {} }, message: 'success' });

    const response = await request(app).get('/api/schemas/latest/schema-name').expect(200);

    expect(response.body).toEqual({ schema: { type: 'object' }, uiSchema: {}, schemaId: 'latest-schema-v2' });
    expect(getSpy.mock.calls[1]?.[0]).toEqual(expect.objectContaining({ url: '2281/schemas/latest-schema-v2/ui-schema' }));
  });

  it.each([
    [{ value: { type: 'object' } }, 'Invalid JSON schema response: missing schema id'],
    [{ id: 'schema-v1' }, 'Invalid JSON schema response: missing schema definition'],
    [{ id: 'schema-v1', value: [] }, 'Invalid JSON schema response: missing schema definition'],
    [undefined, 'Invalid JSON schema response: missing schema definition'],
  ])('fails closed when latest schema payload is malformed', async (schema, message) => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: schema, message: 'success' });

    const response = await request(app).get('/api/schemas/latest/schema-name').expect(502);

    expect(response.body).toEqual({ message });
  });

  it('preserves typed upstream schema errors', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockRejectedValue(new HttpException(404, 'Not found'));

    const response = await request(app).get('/api/schemas/schema-v1').expect(404);

    expect(response.body).toEqual({ message: 'Not found' });
  });

  it('treats a missing or malformed UI schema as optional without hiding the JSON schema', async () => {
    vi.spyOn(ApiService.prototype, 'get')
      .mockResolvedValueOnce({ data: { id: 'schema-v1', value: { type: 'object' } }, message: 'success' })
      .mockResolvedValueOnce({ data: { value: [] }, message: 'success' });

    const response = await request(app).get('/api/schemas/latest/schema-name').expect(200);

    expect(response.body).toEqual({ schema: { type: 'object' }, uiSchema: {}, schemaId: 'schema-v1' });
  });
});
