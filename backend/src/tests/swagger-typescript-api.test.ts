jest.mock('swagger-typescript-api', () => ({ generateApi: jest.fn() }));

import { fetchOpenApiDocument } from '@/generate-contracts';

describe('fetchOpenApiDocument', () => {
  it('returns a parsed OpenAPI document for a successful response', async () => {
    const document = { openapi: '3.0.0' };
    const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>().mockResolvedValue(
      new Response(JSON.stringify(document), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(fetchOpenApiDocument('https://api.example.com/api-docs', fetcher)).resolves.toEqual(document);
  });

  it('fails when the API documentation cannot be fetched', async () => {
    const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>().mockResolvedValue(new Response('', { status: 404 }));

    await expect(fetchOpenApiDocument('https://api.example.com/api-docs', fetcher)).rejects.toThrow(
      'Kunde inte hämta api-docs från https://api.example.com/api-docs (HTTP 404)',
    );
  });
});
