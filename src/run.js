#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');

const electronPath = path.join(__dirname, 'konata-desktop'); 

const child = spawn('electron', [electronPath], {
  stdio: 'inherit'
});

child.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});
