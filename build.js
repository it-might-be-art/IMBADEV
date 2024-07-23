const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clear the build directory
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true });
}
fs.mkdirSync(buildDir);

// Create netlify/functions directory
const functionsDir = path.join(buildDir, 'netlify', 'functions');
fs.mkdirSync(functionsDir, { recursive: true });

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

// Create ssr.js in the functions directory
const ssrContent = `
const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const ejs = require('ejs');

const app = express();

app.engine('ejs', ejs.renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', '..', 'src', 'views'));

app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// Add your routes here
app.get('/', (req, res) => {
  res.render('index', { title: 'Home', currentPage: 'home', profile: {} });
});

// Add other routes as needed

module.exports.handler = serverless(app);
`;

fs.writeFileSync(path.join(functionsDir, 'ssr.js'), ssrContent);

// Copy netlify.toml to build directory
const netlifyTomlPath = path.join(__dirname, 'netlify.toml');
const netlifyTomlDestPath = path.join(buildDir, 'netlify.toml');
if (fs.existsSync(netlifyTomlPath)) {
  fs.copyFileSync(netlifyTomlPath, netlifyTomlDestPath);
} else {
  console.log('Warning: netlify.toml does not exist in the root directory');
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
      fs.chmodSync(fullPath, '755'); // rwxr-xr-x for directories
      setPermissions(fullPath); // Recurse into subdirectories
    } else {
      fs.chmodSync(fullPath, '644'); // rw-r--r-- for files
    }
  });
}
setPermissions(buildDir);

// List all files in the build directory
console.log('Files in build directory:');
console.log(execSync(`ls -R ${buildDir}`).toString());

// After all copying is done, log the contents of the build directory
console.log('Final build directory structure:');
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

console.log('Build script executed');