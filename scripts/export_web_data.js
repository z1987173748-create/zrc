const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const menu = require(path.join(root, 'data', 'menu.js')).map((item) => ({
  ...item,
  image: item.image.replace(/^\/assets\//, '../assets/')
}));
const outputDir = path.join(root, 'web', 'data');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'menu.js'),
  `window.WebMenuData = ${JSON.stringify(menu, null, 2)};\n`,
  'utf8'
);

console.log(`exported ${menu.length} dishes to web/data/menu.js`);
