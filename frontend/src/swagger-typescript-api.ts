import { exec } from 'child_process';
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
config();
const execAsync = promisify(exec);

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');
const SWAGGER_PATH = path.join(PATH_TO_OUTPUT_DIR, 'backend', 'swagger.json');

const main = async () => {
  if (!fs.existsSync(`${PATH_TO_OUTPUT_DIR}/backend`)) {
    fs.mkdirSync(`${PATH_TO_OUTPUT_DIR}/backend`, { recursive: true });
  }
  console.log('Downloading and generating api-docs for backend');

  // Hämtas med fetch i stället för curl via shell, så att env-variabeln aldrig når en kommandorad
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/swagger.json`);
  if (!response.ok) {
    throw new Error(`Failed to download swagger.json: ${response.status} ${response.statusText}`);
  }
  fs.writeFileSync(SWAGGER_PATH, Buffer.from(await response.arrayBuffer()));

  await execAsync(
    `npx swagger-typescript-api generate --path "${SWAGGER_PATH}" --output "${PATH_TO_OUTPUT_DIR}/backend" --modular --no-client`
  );

  fs.unlinkSync(SWAGGER_PATH);
};

main();
