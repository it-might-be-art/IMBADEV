const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clear the build directory
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true });
}
fs.mkdirSync(buildDir, { recursive: true });


// Copy necessary files to functions directory
const filesToCopy = ['package.json', 'package-lock.json', 'app.js'];
filesToCopy.forEach(file => {
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(functionsDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  } else {
    console.log(`Warning: ${srcPath} does not exist`);
  }
});

// Copy src directory to functions directory
const srcDir = path.join(__dirname, 'src');
const destDir = path.join(functionsDir, 'src');
fs.cpSync(srcDir, destDir, { recursive: true });

// Copy public directory to functions directory
const publicDir = path.join(__dirname, 'public');
const publicDestDir = path.join(functionsDir, 'public');
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, publicDestDir, { recursive: true });
} else {
  console.log(`Warning: ${publicDir} does not exist`);
}

// Ensure uploads directory exists
const uploadsDir = path.join(publicDestDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

console.log('Installing dependencies in the functions directory...');
execSync('npm install', { 
  cwd: functionsDir, 
  stdio: 'inherit' 
});

// Create .env file if it doesn't already exist in the build directory
const envPath = path.join(functionsDir, '.env');
const envContent = `
MONGODB_URI=${process.env.MONGODB_URI}
SESSION_SECRET=${process.env.SESSION_SECRET}
`;
fs.writeFileSync(envPath, envContent);

// Set permissions for all files in the build directory
function setPermissions(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      fs.chmodSync(fullPath, '755'); // rwxr-xr-x for directories
      setPermissions(fullPath); // Recurse into subdirectories
    } else {
      fs.chmodSync(fullPath, '644'); // rw-r--r-- for files
    }
  });
}
setPermissions(buildDir);

// Log the final build directory structure
function logDirectoryStructure(dir, level = 0) {
  const indent = ' '.repeat(level * 2);
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      console.log(`${indent}${file}/`);
      logDirectoryStructure(filePath, level + 1);
    } else {
      console.log(`${indent}${file}`);
    }
  });
}
logDirectoryStructure(buildDir);

// Read the package.json in the functions directory
const functionsPackageJsonPath = path.join(functionsDir, 'package.json');
if (fs.existsSync(functionsPackageJsonPath)) {
  const functionsPackageJson = require(functionsPackageJsonPath);
  console.log('Functions directory dependencies:', functionsPackageJson.dependencies);
} else {
  console.log('Warning: package.json not found in the functions directory');
}

console.log('Build script executed');
