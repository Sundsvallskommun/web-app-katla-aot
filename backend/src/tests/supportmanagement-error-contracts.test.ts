import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import type { NextFunction, Request, Response } from 'express';
import { getMetadataArgsStorage } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { SupportManagementController } from '@/controllers/supportmanagement.controller';
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

const createApp = () => new App([SupportManagementController]).getServer();
const app = createApp();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SupportManagement HTTP error contracts', () => {
  it('documents notification acknowledgement as a required array body', () => {
    const schemas = validationMetadatasToSchemas({
      classTransformerMetadataStorage: defaultMetadataStorage,
      refPointerPrefix: '#/components/schemas/',
    });
    const spec: unknown = routingControllersToSpec(
      getMetadataArgsStorage(),
      { routePrefix: '/api', controllers: [SupportManagementController] },
      { components: { schemas } },
    );

    if (!spec || typeof spec !== 'object' || !('paths' in spec)) {
      throw new Error('Expected paths in OpenAPI document');
    }
    const { paths } = spec;
    if (!paths || typeof paths !== 'object' || !('/api/supportmanagement/notifications' in paths)) {
      throw new Error('Expected notification acknowledgement path in OpenAPI document');
    }
    const notificationsPath = paths['/api/supportmanagement/notifications'];
    if (!notificationsPath || typeof notificationsPath !== 'object' || !('patch' in notificationsPath)) {
      throw new Error('Expected notification acknowledgement path in OpenAPI document');
    }
    const { patch: patchOperation } = notificationsPath;
    if (!patchOperation || typeof patchOperation !== 'object' || !('requestBody' in patchOperation)) {
      throw new Error('Expected notification acknowledgement request body in OpenAPI document');
    }

    expect(patchOperation.requestBody).toEqual(
      expect.objectContaining({
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              minItems: 1,
              items: { $ref: '#/components/schemas/NotificationDTO' },
            },
          },
        },
      }),
    );
  });

  it('preserves the successful create response contract', async () => {
    const postSpy = vi.spyOn(ApiService.prototype, 'post').mockResolvedValue({
      data: { id: 'errand-id', errandNumber: 'ERRAND-1', stakeholders: [] },
      message: 'success',
    });

    const response = await request(app).post('/api/supportmanagement/errand/create').send({}).expect(200);

    expect(response.body).toEqual({ id: 'errand-id', errandNumber: 'ERRAND-1', stakeholders: [] });
    expect(postSpy).toHaveBeenCalledWith(expect.objectContaining({ propagateClientError: true }), expect.anything());
  });

  it('propagates a typed upstream error when creating an errand', async () => {
    vi.spyOn(ApiService.prototype, 'post').mockRejectedValue(new HttpException(500, 'SupportManagement unavailable'));

    const response = await request(app).post('/api/supportmanagement/errand/create').send({}).expect(500);

    expect(response.body).toEqual({ message: 'SupportManagement unavailable' });
  });

  it('returns 502 when create receives a malformed successful response', async () => {
    vi.spyOn(ApiService.prototype, 'post').mockResolvedValue({ data: {}, message: 'success' });

    const response = await request(app).post('/api/supportmanagement/errand/create').send({}).expect(502);

    expect(response.body).toEqual({ message: 'No stakeholders in response when creating errand' });
  });

  it.each([
    ['save', '/api/supportmanagement/errand/save'],
    ['update', '/api/supportmanagement/errand/errand-id'],
  ])('propagates a typed upstream error when attempting to %s an errand', async (_operation, path) => {
    const patchSpy = vi.spyOn(ApiService.prototype, 'patch').mockRejectedValue(new HttpException(409, 'Errand was modified elsewhere'));

    const payload = path.endsWith('/save') ? { id: 'errand-id', title: 'Changed' } : { title: 'Changed' };
    const response = await request(app).patch(path).send(payload).expect(409);

    expect(response.body).toEqual({ message: 'Errand was modified elsewhere' });
    expect(patchSpy).toHaveBeenCalledWith(expect.objectContaining({ propagateClientError: true }), expect.anything());
  });

  it('fails explicitly when save is missing an errand id', async () => {
    const patchSpy = vi.spyOn(ApiService.prototype, 'patch');

    const response = await request(app).patch('/api/supportmanagement/errand/save').send({ title: 'Changed' }).expect(400);

    expect(response.body).toEqual({ message: 'Errand id is required when saving an errand' });
    expect(patchSpy).not.toHaveBeenCalled();
  });

  it.each([
    ['save', '/api/supportmanagement/errand/save', { id: 'errand-id', title: 'Changed' }, 'saving'],
    ['update', '/api/supportmanagement/errand/errand-id', { title: 'Changed' }, 'updating'],
  ])('returns 502 when %s receives an empty successful response', async (_operation, path, payload, messagePart) => {
    vi.spyOn(ApiService.prototype, 'patch').mockResolvedValue({ data: undefined, message: 'success' });

    const response = await request(app).patch(path).send(payload).expect(502);

    expect(response.body).toEqual({ message: `Invalid response when ${messagePart} errand` });
  });

  it('returns 404 when an errand number has no matching errand', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: { content: [] }, message: 'success' });

    const response = await request(app).get('/api/supportmanagement/errand/ERRAND-404').expect(404);

    expect(response.body).toEqual({ message: 'Errand not found' });
  });

  it('propagates upstream errors from every read endpoint', async () => {
    const getSpy = vi.spyOn(ApiService.prototype, 'get').mockRejectedValue(new HttpException(503, 'Upstream unavailable'));
    const paths = [
      '/api/supportmanagement/errands',
      '/api/supportmanagement/count',
      '/api/supportmanagement/metadata',
      '/api/supportmanagement/notifications',
    ];

    for (const path of paths) {
      const response = await request(app).get(path).expect(503);
      expect(response.body).toEqual({ message: 'Upstream unavailable' });
    }

    expect(getSpy).toHaveBeenCalledTimes(paths.length);
  });

  it('returns 502 when a read endpoint receives an empty successful response', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: undefined, message: 'success' });

    const response = await request(app).get('/api/supportmanagement/metadata').expect(502);

    expect(response.body).toEqual({ message: 'Invalid response when reading metadata' });
  });

  it('returns 502 when count receives a malformed successful response', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: {}, message: 'success' });

    const response = await request(app).get('/api/supportmanagement/count').expect(502);

    expect(response.body).toEqual({ message: 'Invalid response when counting errands' });
  });

  it('propagates notification acknowledgement errors', async () => {
    const patchSpy = vi.spyOn(ApiService.prototype, 'patch').mockRejectedValue(new HttpException(404, 'Notification not found'));

    const response = await request(app)
      .patch('/api/supportmanagement/notifications')
      .send([{ id: 'notification-id', acknowledged: true }])
      .expect(404);

    expect(response.body).toEqual({ message: 'Notification not found' });
    expect(patchSpy).toHaveBeenCalledWith(expect.objectContaining({ propagateClientError: true }), expect.anything());
  });

  it('preserves the successful notification acknowledgement response contract', async () => {
    vi.spyOn(ApiService.prototype, 'patch').mockResolvedValue({
      data: undefined,
      message: 'success',
    });

    const response = await request(app)
      .patch('/api/supportmanagement/notifications')
      .send([{ id: 'notification-id', acknowledged: true }])
      .expect(200);

    expect(response.body).toEqual({ data: true, message: 'Success' });
  });

  it('forwards the notification acknowledgement array unchanged', async () => {
    const patchSpy = vi.spyOn(ApiService.prototype, 'patch').mockResolvedValue({
      data: undefined,
      message: 'success',
    });
    const notifications = [{ id: 'notification-id', acknowledged: true }];

    await request(app).patch('/api/supportmanagement/notifications').send(notifications).expect(200);

    expect(patchSpy).toHaveBeenCalledWith(expect.objectContaining({ data: notifications }), expect.anything());
  });

  it.each([{}, []])('rejects a non-array or empty acknowledgement body', async body => {
    const patchSpy = vi.spyOn(ApiService.prototype, 'patch');

    const response = await request(app).patch('/api/supportmanagement/notifications').send(body).expect(400);

    expect(response.body).toEqual({ message: 'At least one notification is required' });
    expect(patchSpy).not.toHaveBeenCalled();
  });

  it('serializes sort exactly once before calling SupportManagement', async () => {
    const getSpy = vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: { content: [] }, message: 'success' });

    const response = await request(app).get('/api/supportmanagement/errands?sort=created%2Cdesc').expect(200);

    const requestConfig = getSpy.mock.calls[0]?.[0];
    if (!requestConfig?.url) throw new Error('Expected SupportManagement request URL');
    const upstreamUrl = new URL(requestConfig.url, 'http://supportmanagement.test');

    expect(upstreamUrl.searchParams.get('sort')).toBe('created,desc');
    expect(requestConfig.url).not.toContain('%252C');
    expect(response.body).toEqual({ content: [] });
  });
});
