
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
