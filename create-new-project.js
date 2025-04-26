#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(childItemName => {
      if (childItemName === 'node_modules' || childItemName === '.git') return;
      copyRecursiveSync(path.join(src, childItemName),
        path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function updatePackageJson(dest, newName) {
  const pkgPath = path.join(dest, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = newName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
}

rl.question('Enter new project directory name: ', (projectName) => {
  const srcDir = process.cwd();
  const destDir = path.join(path.dirname(srcDir), projectName);
  if (fs.existsSync(destDir)) {
    console.error('Directory already exists:', destDir);
    rl.close();
    process.exit(1);
  }
  copyRecursiveSync(srcDir, destDir);
  updatePackageJson(destDir, projectName);
  console.log('New project created at', destDir);
  rl.close();
});