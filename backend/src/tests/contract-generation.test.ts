import { describe, expect, it, vi } from 'vitest';

import type { ContractGenerator } from '@/generate-contracts';
import { fetchOpenApiDocument, main } from '@/generate-contracts';

describe('contract generation', () => {
  it('returns a parsed OpenAPI document for a successful response', async () => {
    const document = { openapi: '3.0.0' };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(document), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(fetchOpenApiDocument('https://api.example.com/api-docs', fetcher)).resolves.toEqual(document);
  });

  it('fails when the API documentation cannot be fetched', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 404 }));

    await expect(fetchOpenApiDocument('https://api.example.com/api-docs', fetcher)).rejects.toThrow(
      'Kunde inte hämta api-docs från https://api.example.com/api-docs (HTTP 404)',
    );
  });

  it('does not generate files after a failed download', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 404 }));
    const generate = vi.fn<ContractGenerator>();

    await expect(main({ fetcher, generate })).rejects.toThrow('(HTTP 404)');
    expect(generate).not.toHaveBeenCalled();
  });
});
