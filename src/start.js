const { spawn } = require('child_process');
const path = require('path');

const mainScriptPath = path.join(__dirname, './konata-desktop.js');

const electronProcess = spawn('electron', [mainScriptPath]);

electronProcess.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

electronProcess.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

electronProcess.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

electronProcess.on('error', (err) => {
  console.error('Failed to start Electron process:', err);
});
