// This wrapper will be copied to dist/index.js to make it location-agnostic
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { existsSync } from 'fs';

// Find the actual server code regardless of where this file is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Possible locations for the actual server code
const possibleServerPaths = [
  // If this file is at /opt/render/project/src/dist/index.js, look for server code at:
  resolve(__dirname, '..', '..', 'server', 'dist', 'index.js'), // /opt/render/project/server/dist/index.js
  resolve(__dirname, '..', 'server', 'dist', 'index.js'),
  resolve(__dirname, 'index.js'), // Same directory (normal case)
  resolve(process.cwd(), 'dist', 'index.js'),
  resolve(process.cwd(), 'server', 'dist', 'index.js'),
  // Absolute paths
  '/opt/render/project/server/dist/index.js',
  '/opt/render/project/dist/index.js',
];

let serverPath = null;
for (const path of possibleServerPaths) {
  if (existsSync(path)) {
    serverPath = path;
    console.log(`✓ Found server code at: ${serverPath}`);
    break;
  }
}

if (!serverPath) {
  // If we can't find it, try to import from current directory (fallback)
  console.log('⚠️  Could not find server code in expected locations, trying current directory...');
  serverPath = resolve(__dirname, 'index.js');
  
  if (!existsSync(serverPath)) {
    console.error('✗ Error: Cannot find server code. Tried:');
    possibleServerPaths.forEach(p => console.error(`  - ${p}`));
    process.exit(1);
  }
}

// Import and run the actual server
await import(serverPath);

