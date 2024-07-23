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

// Copy src directory to netlify/functions directory
const srcDir = path.join(__dirname, 'src');
const destDir = path.join(buildDir, 'netlify', 'functions');
fs.cpSync(srcDir, destDir, { recursive: true });

// Copy utils directory to build directory (root level)
const utilsDir = path.join(__dirname, 'utils');
const utilsDestDir = path.join(buildDir, 'utils');
if (fs.existsSync(utilsDir)) {
  fs.cpSync(utilsDir, utilsDestDir, { recursive: true });
} else {
  console.log(`Warning: ${utilsDir} does not exist`);
}

// Copy public directory to netlify/functions directory
const publicDir = path.join(__dirname, 'public');
const publicDestDir = path.join(buildDir, 'netlify', 'functions', 'public');
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, publicDestDir, { recursive: true });
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

// Copy netlify.toml to build directory
const netlifyTomlPath = path.join(__dirname, 'netlify.toml');
const netlifyTomlDestPath = path.join(buildDir, 'netlify.toml');
if (fs.existsSync(netlifyTomlPath)) {
  fs.copyFileSync(netlifyTomlPath, netlifyTomlDestPath);
  console.log('netlify.toml copied to build directory');
} else {
  console.log('Warning: netlify.toml does not exist in the root directory');
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

// Logging für Debugging
console.log('Current directory:', __dirname);
console.log('Netlify function root:', process.env.LAMBDA_TASK_ROOT);

// Setzen Sie den Pfad zu den Views
app.set('views', path.join(process.env.LAMBDA_TASK_ROOT, 'src', 'views'));

// Logging des gesetzten View-Pfads
console.log('Views directory set to:', app.get('views'));

// Statische Dateien
app.use(express.static(path.join(process.env.LAMBDA_TASK_ROOT, 'public')));

// Routen
app.get('/', (req, res) => {
  console.log('Attempting to render index view');
  res.render('index', { 
    title: 'Home', 
    currentPage: 'home', 
    profile: {} 
  }, (err, html) => {
    if (err) {
      console.error('Error rendering index view:', err);
      return res.status(500).send('Error rendering view');
    }
    res.send(html);
  });
});

// Weitere Routen hier hinzufügen

// 404 Handler
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

module.exports.handler = serverless(app);
`;

fs.writeFileSync(path.join(functionsDir, 'ssr.js'), ssrContent);

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

// Log the final build directory structure
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