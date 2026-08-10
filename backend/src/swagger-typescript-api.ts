import { execFile } from 'child_process';
import path from 'path';
import fs from 'node:fs';
import { promisify } from 'node:util';

import { APIS, API_BASE_URL } from './config/index';

const execFileAsync = promisify(execFile);

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');

const main = async () => {
  console.log('Downloading and generating api-docs..');
  for (const api of APIS) {
    const outputDir = path.join(PATH_TO_OUTPUT_DIR, api.name);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const swaggerPath = path.join(outputDir, 'swagger.json');
    const response = await fetch(`${API_BASE_URL}/${api.name}/${api.version}/api-docs`);
    if (!response.ok) {
      console.error(`- ${api.name} ${api.version}: kunde inte hämta api-docs (HTTP ${response.status})`);
      continue;
    }
    fs.writeFileSync(swaggerPath, await response.text());
    console.log(`- ${api.name} ${api.version}`);

    const { stdout } = await execFileAsync('npx', [
      'swagger-typescript-api',
      'generate',
      '--modular',
      '-p',
      swaggerPath,
      '-o',
      outputDir,
      '--no-client',
      '--clean-output',
      '--extract-enums',
    ]);
    console.log(`Data-contract-generator: ${stdout}`);
  }
};

main();
