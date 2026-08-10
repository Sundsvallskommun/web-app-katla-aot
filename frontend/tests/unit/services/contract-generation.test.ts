import type { ContractGenerator } from 'src/generate-contracts';
import { fetchOpenApiDocument, main } from 'src/generate-contracts';
import { describe, expect, it, vi } from 'vitest';

describe('frontend contract generation', () => {
  it('returns a parsed OpenAPI document for a successful response', async () => {
    const document = { openapi: '3.0.0' };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(document), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect(fetchOpenApiDocument('https://api.example.com/swagger.json', fetcher)).resolves.toEqual(document);
  });

  it('does not generate files after a failed download', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 404 }));
    const generate = vi.fn<ContractGenerator>();

    await expect(main({ fetcher, generate })).rejects.toThrow('(HTTP 404)');
    expect(generate).not.toHaveBeenCalled();
  });
});
