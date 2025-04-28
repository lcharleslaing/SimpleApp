#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

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
      if (childItemName === 'node_modules' || childItemName === '.git' || childItemName === 'dist') return;
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
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.build = 'rimraf dist && electron-builder';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
}

function updateMainJs(dest, newName) {
  const mainJsPath = path.join(dest, 'main.js');
  if (fs.existsSync(mainJsPath)) {
    let content = fs.readFileSync(mainJsPath, 'utf8');
    content = content.replace(/SimpleApp/g, newName);
    fs.writeFileSync(mainJsPath, content);
  }
}

function updateIndexHtml(dest, newName) {
  const indexPath = path.join(dest, 'index.html');
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    content = content.replace(/SimpleApp/g, newName);
    fs.writeFileSync(indexPath, content);
  }
}

function installDependencies(dest) {
  try {
    process.chdir(dest);
    execSync('npm install rimraf --save-dev', { stdio: 'inherit' });
    console.log('Dependencies installed successfully');
  } catch (error) {
    console.error('Error installing dependencies:', error);
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
  updateMainJs(destDir, projectName);
  updateIndexHtml(destDir, projectName);
  installDependencies(destDir);

  console.log('New project created at', destDir);
  console.log('Project renamed to:', projectName);
  console.log('Build script updated to clean dist folder before building');
  rl.close();
});