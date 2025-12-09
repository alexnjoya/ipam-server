import { existsSync, mkdirSync, copyFileSync, cpSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Copy dist to src/dist if it doesn't exist (for Render compatibility)
const distPath = resolve(__dirname, 'dist');
const srcDistPath = resolve(__dirname, 'src', 'dist');

if (existsSync(distPath) && existsSync(resolve(distPath, 'index.js'))) {
  if (!existsSync(srcDistPath)) {
    mkdirSync(srcDistPath, { recursive: true });
    // Copy the entire dist folder
    cpSync(distPath, srcDistPath, { recursive: true });
    console.log('✅ Copied dist to src/dist for Render compatibility');
  }
}

