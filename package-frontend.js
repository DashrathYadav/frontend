const fs = require('fs');
const path = require('path');

const frontendDir = './rental-management-ui';
const outputFile = 'frontend-package.json';

function readFilesRecursively(dir, basePath = '') {
  const files = {};
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      
      // Skip node_modules and other unnecessary directories
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        Object.assign(files, readFilesRecursively(fullPath, relativePath));
      } else {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          files[relativePath] = content;
        } catch (err) {
          console.log(`Skipping binary file: ${relativePath}`);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
  
  return files;
}

console.log('Packaging frontend files...');

if (!fs.existsSync(frontendDir)) {
  console.error(`Frontend directory ${frontendDir} not found!`);
  process.exit(1);
}

const files = readFilesRecursively(frontendDir);
const packageData = {
  timestamp: new Date().toISOString(),
  files: files,
  totalFiles: Object.keys(files).length
};

fs.writeFileSync(outputFile, JSON.stringify(packageData, null, 2));

console.log(`✅ Successfully packaged ${Object.keys(files).length} files to ${outputFile}`);
console.log('Files included:');
Object.keys(files).forEach(file => console.log(`  - ${file}`));