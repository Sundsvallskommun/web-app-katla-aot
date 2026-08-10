import path from 'node:path';

import { generateApi } from 'swagger-typescript-api';

import { API_BASE_URL, APIS } from './config/index';

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');

export type ContractGenerator = (options: Parameters<typeof generateApi>[0]) => Promise<unknown>;

export interface ContractGenerationDependencies {
  fetcher?: typeof fetch;
  generate?: ContractGenerator;
}

export const fetchOpenApiDocument = async (url: string, fetcher: typeof fetch = fetch): Promise<Record<string, unknown>> => {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Kunde inte hämta api-docs från ${url} (HTTP ${response.status})`);
  }

  const document: unknown = await response.json();
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    throw new Error(`Ogiltigt OpenAPI-dokument från ${url}`);
  }

  return document as Record<string, unknown>;
};

export const main = async ({ fetcher = fetch, generate = generateApi }: ContractGenerationDependencies = {}): Promise<void> => {
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL måste vara satt för att generera kontrakt');
  }

  for (const api of APIS) {
    const outputDir = path.join(PATH_TO_OUTPUT_DIR, api.name);
    const apiDocsUrl = `${API_BASE_URL.replace(/\/$/, '')}/${api.name}/${api.version}/api-docs`;
    const spec = await fetchOpenApiDocument(apiDocsUrl, fetcher);

    await generate({
      spec,
      output: outputDir,
      modular: true,
      generateClient: false,
      cleanOutput: true,
      extractEnums: true,
    });
  }
};

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
