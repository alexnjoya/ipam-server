// Auto-generated wrapper - finds server code from any location
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to find the actual server code
const possiblePaths = [
  resolve(__dirname, 'index.js'), // Same directory (normal case)
  resolve(__dirname, '..', 'server', 'dist', 'index.js'), // If we're in src/dist, look for server/dist
  resolve(__dirname, '..', '..', 'server', 'dist', 'index.js'),
  resolve(process.cwd(), 'dist', 'index.js'),
  resolve(process.cwd(), 'server', 'dist', 'index.js'),
  '/opt/render/project/server/dist/index.js',
  '/opt/render/project/dist/index.js',
];

let serverPath = null;
for (const path of possiblePaths) {
  if (existsSync(path)) {
    serverPath = path;
    break;
  }
}

if (!serverPath || !existsSync(serverPath)) {
  // Last resort: try current directory
  serverPath = resolve(__dirname, 'index.js');
  if (!existsSync(serverPath)) {
    console.error('✗ Cannot find server code. Tried:', possiblePaths);
    process.exit(1);
  }
}

await import(serverPath);
