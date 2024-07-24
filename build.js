const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clear the build directory
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true });
}
fs.mkdirSync(buildDir, { recursive: true });

// Create netlify/functions directory
const functionsDir = path.join(buildDir, 'netlify', 'functions');
fs.mkdirSync(functionsDir, { recursive: true });

// Copy necessary files to build directory
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

// Copy utils directory to functions directory
const utilsDir = path.join(__dirname, 'utils');
const utilsDestDir = path.join(functionsDir, 'utils');
if (fs.existsSync(utilsDir)) {
  fs.cpSync(utilsDir, utilsDestDir, { recursive: true });
  console.log(`Copied utils directory to ${utilsDestDir}`);
} else {
  console.log(`Warning: ${utilsDir} does not exist`);
}

// Log the contents of the utils directory in the build
console.log('Contents of utils directory in build:');
if (fs.existsSync(utilsDestDir)) {
  fs.readdirSync(utilsDestDir).forEach(file => {
    console.log(file);
  });
} else {
  console.log('Utils directory not found in build');
}

// Create a simple file to check if utils directory exists during runtime
const checkFilePath = path.join(functionsDir, 'checkUtils.js');
const checkFileContent = `
const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, 'utils');
console.log('Checking utils directory:', utilsPath);
console.log('Utils directory exists:', fs.existsSync(utilsPath));
if (fs.existsSync(utilsPath)) {
  console.log('Contents of utils directory:');
  fs.readdirSync(utilsPath).forEach(file => {
    console.log(file);
  });
}
`;
fs.writeFileSync(checkFilePath, checkFileContent);
console.log('Created checkUtils.js file');

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