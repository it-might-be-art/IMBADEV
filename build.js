const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clear the build directory
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true });
}
fs.mkdirSync(buildDir);

// Copy necessary files to build directory
const filesToCopy = ['package.json', 'package-lock.json'];
filesToCopy.forEach(file => {
  fs.copyFileSync(path.join(__dirname, file), path.join(buildDir, file));
});

// Install dependencies in build directory
execSync('npm install --production', { cwd: buildDir, stdio: 'inherit' });

// Copy src directory to build directory
const srcDir = path.join(__dirname, 'src');
const destDir = path.join(buildDir, 'src');
execSync(`cp -R ${srcDir} ${destDir}`);

// Remove unnecessary files and directories
const unnecessaryDirs = ['node_modules', 'logs', 'tests'];
unnecessaryDirs.forEach(dir => {
  const dirPath = path.join(buildDir, dir);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true });
  }
});

const unnecessaryFiles = ['*.log'];
unnecessaryFiles.forEach(pattern => {
  const files = execSync(`find ${buildDir} -name "${pattern}" -type f`).toString().split('\n');
  files.forEach(file => {
    if (file) {
      fs.unlinkSync(file);
    }
  });
});

// Create .env file
const envContent = `
MONGODB_URI=${process.env.MONGODB_URI}
SESSION_SECRET=${process.env.SESSION_SECRET}
`;
fs.writeFileSync(path.join(buildDir, '.env'), envContent);

console.log('Build script executed');