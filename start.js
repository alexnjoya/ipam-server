import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try different possible locations (Render might run from different directories)
const possiblePaths = [
  resolve(__dirname, 'dist', 'index.js'),
  resolve(process.cwd(), 'dist', 'index.js'),
  resolve(process.cwd(), 'server', 'dist', 'index.js'),
  resolve(__dirname, '..', 'dist', 'index.js'),
  resolve(__dirname, '..', 'server', 'dist', 'index.js'),
  // Render-specific paths
  resolve(process.cwd(), 'src', 'dist', 'index.js'),
  resolve(__dirname, 'src', 'dist', 'index.js'),
];

let distPath = null;
for (const path of possiblePaths) {
  if (existsSync(path)) {
    distPath = path;
    console.log(`✓ Found dist/index.js at: ${path}`);
    break;
  }
}

if (!distPath) {
  console.error('✗ Error: dist/index.js not found. Tried:');
  possiblePaths.forEach(p => console.error(`  - ${p}`));
  console.error(`Current working directory: ${process.cwd()}`);
  console.error(`__dirname: ${__dirname}`);
  process.exit(1);
}

try {
  console.log(`🚀 Starting server from: ${distPath}`);
  await import(distPath);
} catch (error) {
  console.error('✗ Failed to start server:', error);
  process.exit(1);
}

