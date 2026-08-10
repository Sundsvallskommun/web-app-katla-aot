import path from 'node:path';
import { generateApi } from 'swagger-typescript-api';

import { APIS, API_BASE_URL } from './config/index';

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');

export const fetchOpenApiDocument = async (url: string, fetcher: typeof fetch = fetch): Promise<unknown> => {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Kunde inte hämta api-docs från ${url} (HTTP ${response.status})`);
  }

  return response.json() as Promise<unknown>;
};

export const main = async (): Promise<void> => {
  console.log('Downloading and generating api-docs..');

  for (const api of APIS) {
    const outputDir = path.join(PATH_TO_OUTPUT_DIR, api.name);
    const apiDocsUrl = `${API_BASE_URL}/${api.name}/${api.version}/api-docs`;
    const spec = await fetchOpenApiDocument(apiDocsUrl);

    await generateApi({
      spec,
      output: outputDir,
      modular: true,
      generateClient: false,
      cleanOutput: true,
      extractEnums: true,
    });

    console.log(`- ${api.name} ${api.version}`);
  }
};

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
