import { execFile } from 'node:child_process';
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
config();
const execFileAsync = promisify(execFile);

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');
const SWAGGER_PATH = path.join(PATH_TO_OUTPUT_DIR, 'backend', 'swagger.json');

const main = async () => {
  if (!fs.existsSync(`${PATH_TO_OUTPUT_DIR}/backend`)) {
    fs.mkdirSync(`${PATH_TO_OUTPUT_DIR}/backend`, { recursive: true });
  }
  console.log('Downloading and generating api-docs for backend');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/swagger.json`);
  if (!response.ok) {
    throw new Error(`Kunde inte hämta swagger.json (HTTP ${response.status})`);
  }
  fs.writeFileSync(SWAGGER_PATH, await response.text());

  await execFileAsync('npx', [
    'swagger-typescript-api',
    'generate',
    '--path',
    SWAGGER_PATH,
    '--output',
    `${PATH_TO_OUTPUT_DIR}/backend`,
    '--modular',
    '--no-client',
  ]);

  fs.unlinkSync(SWAGGER_PATH);
};

main();
