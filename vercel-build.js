// vercel-build.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Vercel build process...');

try {
  // Install dependencies in the root directory
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Install and build frontend
  console.log('Building frontend...');
  process.chdir(path.join(__dirname, 'frontend'));
  execSync('npm install', { stdio: 'inherit' });
  execSync('CI=false npm run build', { stdio: 'inherit' });

  // Install backend dependencies
  console.log('Installing backend dependencies...');
  process.chdir(path.join(__dirname, 'backend'));
  execSync('npm install', { stdio: 'inherit' });

  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}