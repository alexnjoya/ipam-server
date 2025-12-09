import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
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
console.log('📦 Current working directory:', process.cwd());
console.log('📦 __dirname:', __dirname);

// The actual dist/index.js should work as-is since all relative imports are in the same dist/ folder
// We just need to ensure dist/ exists in all possible locations Render might look

// Note: The actual dist/index.js file uses relative imports (./routes, ./middleware, etc.)
// These will work as long as the entire dist/ folder is copied together

// List of locations to create dist/ for Render compatibility
const targetLocations = [
  // Relative to server folder (current location)
  resolve(__dirname, 'src', 'dist'),
  // Relative to current working directory (in case build runs from repo root)
  resolve(process.cwd(), 'src', 'dist'),
  // If we're in server folder, create at repo root level
  resolve(__dirname, '..', 'src', 'dist'),
];

// Create dist in all possible locations
for (const targetPath of targetLocations) {
  if (!existsSync(targetPath)) {
    try {
      console.log(`📦 Creating dist at: ${targetPath}`);
      mkdirSync(dirname(targetPath), { recursive: true });
      cpSync(distPath, targetPath, { recursive: true });
      console.log(`✓ Created dist at: ${targetPath}`);
      
      // Verify the copy was successful
      const copiedIndex = join(targetPath, 'index.js');
      if (existsSync(copiedIndex)) {
        console.log(`✓ Verified index.js exists at: ${copiedIndex}`);
      } else {
        console.error(`✗ Warning: index.js not found after copy at: ${copiedIndex}`);
      }
    } catch (error) {
      // Non-fatal - continue to next location
      console.log(`⚠️  Could not create ${targetPath}: ${error.message}`);
    }
  } else {
    console.log(`✓ Dist already exists at: ${targetPath}`);
  }
}

// Final verification: check if key files exist
const keyLocations = [
  resolve(__dirname, 'dist', 'index.js'),
  resolve(__dirname, 'src', 'dist', 'index.js'),
  resolve(__dirname, '..', 'src', 'dist', 'index.js'),
  resolve(process.cwd(), 'src', 'dist', 'index.js'),
];

console.log('\n📋 Verification:');
let foundCount = 0;
for (const loc of keyLocations) {
  if (existsSync(loc)) {
    console.log(`✓ ${loc}`);
    foundCount++;
  } else {
    console.log(`✗ ${loc} (not found)`);
  }
}

if (foundCount === 0) {
  console.error('\n✗ CRITICAL: No dist/index.js found in any expected location!');
  process.exit(1);
}

console.log(`\n✅ Postbuild completed successfully (found ${foundCount} location(s))`);

