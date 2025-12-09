import { existsSync, mkdirSync, cpSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the dist folder location (where TypeScript compiled to)
const distPath = resolve(__dirname, 'dist');

if (!existsSync(distPath)) {
  console.error('✗ Error: dist folder not found at:', distPath);
  process.exit(1);
}

console.log('✓ Found dist folder at:', distPath);

// Create src/dist if it doesn't exist (for Render's /opt/render/project/src/dist/index.js path)
// This handles the case where Render runs "node dist/index.js" from /opt/render/project/src/
const srcDistPath = resolve(__dirname, 'src', 'dist');
if (!existsSync(srcDistPath)) {
  console.log('📦 Creating src/dist for Render compatibility...');
  try {
    mkdirSync(dirname(srcDistPath), { recursive: true });
    // Copy entire dist folder to src/dist
    cpSync(distPath, srcDistPath, { recursive: true });
    console.log('✓ Created src/dist with all compiled files');
  } catch (error) {
    console.error('⚠️  Warning: Could not create src/dist:', error.message);
    console.log('   This is okay if Render uses npm start (recommended)');
  }
} else {
  console.log('✓ src/dist already exists');
}

console.log('✅ Postbuild completed successfully');

