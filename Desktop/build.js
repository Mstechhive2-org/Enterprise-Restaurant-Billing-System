const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparing files for Electron build...');

const frontendDist = path.join(__dirname, '../Frontend/dist');
const backendSrc = path.join(__dirname, '../Backend');

const desktopFrontend = path.join(__dirname, 'frontend');
const desktopBackend = path.join(__dirname, 'backend');

// Helper to copy recursively
function copySync(src, dest, ignore = []) {
  if (ignore.some(i => src.includes(i))) return;
  
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(child => {
      copySync(path.join(src, child), path.join(dest, child), ignore);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Clean old folders
if (fs.existsSync(desktopFrontend)) fs.rmSync(desktopFrontend, { recursive: true, force: true });
if (fs.existsSync(desktopBackend)) fs.rmSync(desktopBackend, { recursive: true, force: true });

// Copy Frontend
console.log('Copying Frontend...');
copySync(frontendDist, desktopFrontend);

// Copy Backend (Ignore node_modules)
console.log('Copying Backend...');
copySync(backendSrc, desktopBackend, ['node_modules', '.git']);

// Install Backend dependencies inside the Desktop folder
console.log('Installing Backend dependencies for production...');
execSync('npm install --omit=dev', { cwd: desktopBackend, stdio: 'inherit' });

console.log('Files ready for electron-builder!');
