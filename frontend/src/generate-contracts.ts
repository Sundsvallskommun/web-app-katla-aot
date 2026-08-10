import { config } from 'dotenv';
import path from 'node:path';
import { generateApi } from 'swagger-typescript-api';

config();

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts/backend');

const fetchOpenApiDocument = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Kunde inte hämta swagger.json från ${url} (HTTP ${response.status})`);
  }

  return response.json() as Promise<unknown>;
};

const main = async (): Promise<void> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL måste vara satt för att generera kontrakt');
  }

  console.log('Downloading and generating api-docs for backend');
  const spec = await fetchOpenApiDocument(`${apiUrl}/swagger.json`);

  await generateApi({
    spec,
    output: PATH_TO_OUTPUT_DIR,
    modular: true,
    generateClient: false,
    cleanOutput: true,
  });
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
