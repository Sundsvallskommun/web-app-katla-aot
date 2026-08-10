import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { config } from 'dotenv';
import { generateApi } from 'swagger-typescript-api';

config();

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts/backend');

export type ContractGenerator = (options: Parameters<typeof generateApi>[0]) => Promise<unknown>;

export interface ContractGenerationDependencies {
  fetcher?: typeof fetch;
  generate?: ContractGenerator;
}

export const fetchOpenApiDocument = async (
  url: string,
  fetcher: typeof fetch = fetch
): Promise<Record<string, unknown>> => {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Kunde inte hämta swagger.json från ${url} (HTTP ${response.status})`);
  }

  const document: unknown = await response.json();
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    throw new Error(`Ogiltigt OpenAPI-dokument från ${url}`);
  }

  return document as Record<string, unknown>;
};

export const main = async ({
  fetcher = fetch,
  generate = generateApi,
}: ContractGenerationDependencies = {}): Promise<void> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL måste vara satt för att generera kontrakt');
  }

  const spec = await fetchOpenApiDocument(`${apiUrl.replace(/\/$/, '')}/swagger.json`, fetcher);

  await generate({
    spec,
    output: PATH_TO_OUTPUT_DIR,
    modular: true,
    generateClient: false,
    cleanOutput: true,
  });
};

const entrypoint = process.argv[1];
if (entrypoint !== undefined && import.meta.url === pathToFileURL(entrypoint).href) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
