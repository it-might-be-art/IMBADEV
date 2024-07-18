const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clear the build directory
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  fs.rmdirSync(buildDir, { recursive: true });
}
fs.mkdirSync(buildDir);

// Copy necessary files to build directory
const filesToCopy = ['package.json', 'package-lock.json', '.env'];
filesToCopy.forEach(file => {
  fs.copyFileSync(path.join(__dirname, file), path.join(buildDir, file));
});

// Install dependencies in build directory
execSync('npm install --production', { cwd: buildDir, stdio: 'inherit' });

// Copy src directory to build directory
const srcDir = path.join(__dirname, 'src');
const destDir = path.join(buildDir, 'src');
execSync(`cp -R ${srcDir} ${destDir}`);

console.log('Build script executed');