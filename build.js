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
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(buildDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  } else {
    console.log(`Warning: ${srcPath} does not exist`);
  }
});

// Copy config.yaml to build directory
const configSrcPath = path.join(__dirname, '.deploy-now', 'IMBADEV', 'config.yaml');
const configDestPath = path.join(buildDir, 'config.yaml');
if (fs.existsSync(configSrcPath)) {
  fs.copyFileSync(configSrcPath, configDestPath);
  console.log('config.yaml copied to build directory');
} else {
  console.log('Warning: config.yaml does not exist at path:', configSrcPath);
}

// Copy src directory to build directory
const srcDir = path.join(__dirname, 'src');
const destDir = path.join(buildDir, 'src');
execSync(`cp -R ${srcDir} ${destDir}`);

// Copy utils directory to build directory (root level)
const utilsDir = path.join(__dirname, 'utils');
const utilsDestDir = path.join(buildDir, 'utils');
if (fs.existsSync(utilsDir)) {
  execSync(`cp -R ${utilsDir} ${utilsDestDir}`);
} else {
  console.log(`Warning: ${utilsDir} does not exist`);
}

// Copy public directory directly to build directory
const publicDir = path.join(__dirname, 'public');
const publicDestDir = path.join(buildDir, 'public');
if (fs.existsSync(publicDir)) {
  execSync(`cp -R ${publicDir} ${publicDestDir}`);
} else {
  console.log(`Warning: ${publicDir} does not exist`);
}

// Ensure uploads directory exists
const uploadsDir = path.join(publicDestDir, 'uploads');
if (fs.existsSync(uploadsDir)) {
  // Remove all files inside the uploads directory
  fs.readdirSync(uploadsDir).forEach(file => {
    const filePath = path.join(uploadsDir, file);
    fs.rmSync(filePath, { recursive: true, force: true });
  });
} else {
  fs.mkdirSync(uploadsDir);
}

// Install dependencies in build directory
execSync('npm install --omit=dev', { cwd: buildDir, stdio: 'inherit' });

// Remove unnecessary files and directories
const unnecessaryDirs = ['logs', 'tests'];
unnecessaryDirs.forEach(dir => {
  const dirPath = path.join(buildDir, dir);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true });
  }
});

const unnecessaryFiles = ['*.log', 'README.md', '.gitignore'];
unnecessaryFiles.forEach(pattern => {
  const files = execSync(`find ${buildDir} -name "${pattern}" -type f`).toString().split('\n');
  files.forEach(file => {
    if (file) {
      fs.unlinkSync(file);
    }
  });
});

// Create .env file if it doesn't already exist in the build directory
const envPath = path.join(buildDir, '.env');
const envContent = `
MONGODB_URI=${process.env.MONGODB_URI}
SESSION_SECRET=${process.env.SESSION_SECRET}
IONOS_DEPLOYMENT_TEST=${process.env.IONOS_DEPLOYMENT_TEST || 'false'}
`;
fs.writeFileSync(envPath, envContent);

// Set permissions for all files in the build directory
function setPermissions(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      setPermissions(fullPath);
    } else {
      fs.chmodSync(fullPath, '644'); // rw-r--r--
    }
  });
}

setPermissions(buildDir);

// List all files in the build directory
console.log('Files in build directory:');
console.log(execSync(`ls -R ${buildDir}`).toString());

// After all copying is done, log the contents of the build directory
console.log('Contents of build directory:');
function logDirectoryContents(dir, indent = '') {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      console.log(`${indent}${item}/`);
      logDirectoryContents(fullPath, indent + '  ');
    } else {
      console.log(`${indent}${item}`);
    }
  });
}
logDirectoryContents(buildDir);

console.log('Build script executed');