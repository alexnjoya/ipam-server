import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Comprehensive path search for Render's various directory structures
const possiblePaths = [
  // Standard locations (relative to start.js)
  resolve(__dirname, 'dist', 'index.js'),
  resolve(__dirname, '..', 'dist', 'index.js'),
  
  // Current working directory variations
  resolve(process.cwd(), 'dist', 'index.js'),
  resolve(process.cwd(), 'server', 'dist', 'index.js'),
  
  // Render-specific paths (Render might set root to src or server)
  resolve(process.cwd(), 'src', 'dist', 'index.js'),
  resolve(__dirname, 'src', 'dist', 'index.js'),
  resolve(__dirname, '..', 'src', 'dist', 'index.js'),
  
  // Absolute Render paths
  '/opt/render/project/src/dist/index.js',
  '/opt/render/project/src/server/dist/index.js',
  '/opt/render/project/src/dist/index.js',
  '/opt/render/project/dist/index.js',
  '/opt/render/project/server/dist/index.js',
  
  // Additional variations
  resolve(process.cwd(), '..', 'dist', 'index.js'),
  resolve(__dirname, '..', '..', 'dist', 'index.js'),
  resolve(__dirname, '..', '..', 'server', 'dist', 'index.js'),
];

console.log('🔍 Searching for dist/index.js...');
console.log(`Current working directory: ${process.cwd()}`);
console.log(`__dirname: ${__dirname}`);

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
  possiblePaths.forEach(p => {
    console.error(`  - ${p} ${existsSync(p) ? '✓' : '✗'}`);
  });
  console.error(`\nCurrent working directory: ${process.cwd()}`);
  console.error(`__dirname: ${__dirname}`);
  console.error('\n💡 Make sure:');
  console.error('   1. Build command completed successfully');
  console.error('   2. Root Directory in Render is set to "server" (if repo has client/server)');
  console.error('   3. Start Command in Render is set to "npm start" (not "node dist/index.js")');
  process.exit(1);
}

try {
  console.log(`🚀 Starting server from: ${distPath}`);
  await import(distPath);
} catch (error) {
  console.error('✗ Failed to start server:', error);
  console.error(error.stack);
  process.exit(1);
}

