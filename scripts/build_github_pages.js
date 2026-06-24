const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'docs');
const webDir = path.join(root, 'web');
const assetSourceDir = path.join(root, 'assets', 'dishes', 'generated');
const assetTargetDir = path.join(docsDir, 'assets', 'dishes', 'generated');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function removeDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function copyDir(sourceDir, targetDir) {
  ensureDir(targetDir);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function rewriteMenuData() {
  const menuPath = path.join(docsDir, 'data', 'menu.js');
  const content = fs.readFileSync(menuPath, 'utf8');
  const next = content.replace(/\.\.\/assets\/dishes\/generated\//g, './assets/dishes/generated/');
  fs.writeFileSync(menuPath, next, 'utf8');
}

function writeNoJekyll() {
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '', 'utf8');
}

removeDir(docsDir);
copyDir(webDir, docsDir);
copyDir(assetSourceDir, assetTargetDir);
rewriteMenuData();
writeNoJekyll();

console.log(`built GitHub Pages bundle in ${docsDir}`);
