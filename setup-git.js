// Script to help initialize Git repository
const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to execute shell commands
function runCommand(command) {
  try {
    console.log(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Main function
async function setupGit() {
  console.log('\n===== Git Repository Setup for Excel Analytics Platform =====\n');
  
  // Check if git is installed
  try {
    execSync('git --version', { encoding: 'utf8' });
  } catch (error) {
    console.error('Git is not installed. Please install Git before continuing.');
    process.exit(1);
  }

  // Check if .git directory already exists
  if (fs.existsSync(path.join(__dirname, '.git'))) {
    console.log('Git repository is already initialized.');
    
    // Ask if user wants to continue with remote setup
    rl.question('Do you want to set up a GitHub remote? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        setupRemote();
      } else {
        console.log('Exiting setup.');
        rl.close();
      }
    });
  } else {
    // Initialize git repository
    if (runCommand('git init')) {
      console.log('Git repository initialized successfully.');
      
      // Create .gitignore if it doesn't exist
      if (!fs.existsSync(path.join(__dirname, '.gitignore'))) {
        console.log('Creating .gitignore file...');
        fs.writeFileSync(path.join(__dirname, '.gitignore'), `
# Dependencies
node_modules/
/.pnp
.pnp.js

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build files
/frontend/build

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Testing
/coverage

# IDE files
.idea/
.vscode/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db
`);
      }
      
      // Add all files
      if (runCommand('git add .')) {
        console.log('Files added to git staging area.');
        
        // Commit changes
        if (runCommand('git commit -m "Initial commit"')) {
          console.log('Initial commit created.');
          setupRemote();
        } else {
          rl.close();
        }
      } else {
        rl.close();
      }
    } else {
      console.log('Failed to initialize git repository.');
      rl.close();
    }
  }
}

// Function to set up GitHub remote
function setupRemote() {
  rl.question('Enter your GitHub username: ', (username) => {
    rl.question('Enter your repository name: ', (repoName) => {
      const remoteUrl = `https://github.com/${username}/${repoName}.git`;
      
      // Check if remote already exists
      try {
        const remotes = execSync('git remote -v', { encoding: 'utf8' });
        if (remotes.includes('origin')) {
          rl.question('Remote "origin" already exists. Do you want to overwrite it? (y/n): ', (answer) => {
            if (answer.toLowerCase() === 'y') {
              runCommand(`git remote set-url origin ${remoteUrl}`);
              console.log(`Remote URL updated to: ${remoteUrl}`);
              pushToGitHub();
            } else {
              console.log('Remote setup skipped.');
              rl.close();
            }
          });
        } else {
          runCommand(`git remote add origin ${remoteUrl}`);
          console.log(`Remote added: ${remoteUrl}`);
          pushToGitHub();
        }
      } catch (error) {
        runCommand(`git remote add origin ${remoteUrl}`);
        console.log(`Remote added: ${remoteUrl}`);
        pushToGitHub();
      }
    });
  });
}

// Function to push to GitHub
function pushToGitHub() {
  rl.question('Do you want to push to GitHub now? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      console.log('Pushing to GitHub...');
      runCommand('git push -u origin main || git push -u origin master');
    } else {
      console.log('\nTo push to GitHub later, run: git push -u origin main');
    }
    
    console.log('\n===== Git setup completed =====');
    console.log('Next steps:');
    console.log('1. Create a Vercel account if you don\'t have one: https://vercel.com');
    console.log('2. Import your GitHub repository in Vercel');
    console.log('3. Configure environment variables in Vercel dashboard');
    console.log('4. Deploy your application');
    console.log('\nFor more details, refer to the DEPLOYMENT.md file.');
    
    rl.close();
  });
}

// Start the setup process
setupGit();