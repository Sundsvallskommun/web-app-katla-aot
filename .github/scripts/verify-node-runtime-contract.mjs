import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readText = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const pinnedNodeVersion = readText('.nvmrc').trim();
const semverParts = pinnedNodeVersion.split('.').map(Number);

assert.match(pinnedNodeVersion, /^\d+\.\d+\.\d+$/, '.nvmrc must contain one exact Node.js version');

const packagePaths = ['backend/package.json', 'frontend/package.json'];
let canonicalNodeRange;
for (const packagePath of packagePaths) {
  const packageJson = JSON.parse(readText(packagePath));
  const supportedNodeRange = packageJson.engines?.node;
  const nodeTypeVersion = packageJson.devDependencies?.['@types/node'];

  assert.equal(typeof supportedNodeRange, 'string', `${packagePath} must declare engines.node`);
  canonicalNodeRange ??= supportedNodeRange;
  assert.equal(supportedNodeRange, canonicalNodeRange, 'Frontend and backend must support the same Node.js range');
  assert.ok(
    supportedNodeRange.split(/\s+/).includes(`>=${pinnedNodeVersion}`),
    `${packagePath} engines.node must include the pinned .nvmrc version as its lower bound`
  );
  assert.match(
    nodeTypeVersion,
    new RegExp(`^\\^?${semverParts[0]}\\.`),
    `${packagePath} @types/node must match the pinned Node.js major version`
  );
}

const dockerfilePaths = ['backend/Dockerfile', 'frontend/Dockerfile'];
for (const dockerfilePath of dockerfilePaths) {
  const dockerfile = readText(dockerfilePath);
  const defaultNodeVersion = dockerfile.match(/^ARG NODE_VERSION=(\S+)$/m)?.[1];

  assert.equal(
    defaultNodeVersion,
    pinnedNodeVersion,
    `${dockerfilePath} NODE_VERSION must match the version pinned in .nvmrc`
  );

  assert.match(
    dockerfile,
    /^RUN test "\$\(yarn --version\)" = "\$\{YARN_VERSION\}"$/m,
    `${dockerfilePath} must verify the Yarn version bundled with the Node image`
  );
}

const documentedNodeVersion = `Node ${pinnedNodeVersion}`;
for (const documentationPath of ['README.md', 'CLAUDE.md']) {
  assert.ok(
    readText(documentationPath).includes(documentedNodeVersion),
    `${documentationPath} must document the version pinned in .nvmrc`
  );
}
