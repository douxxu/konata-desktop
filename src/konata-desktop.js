const { app, BrowserWindow, screen, ipcMain } = require('electron');
const axios = require('axios');


console.log('|============================================|');
console.log('|#MADE BY @DOUXX.XYZ ~                       |');
console.log('|Github: @douxxu ~                           |');
console.log('|Discord: @douxx.xyz ~                       |');
console.log('|Tiktok: @douxxpi ~                          |');
console.log('|============================================|');
console.log('|#Konata-desktop ~                           |');
console.log('|Github: github.com/douxxxu/konata-desktop ~ |');
console.log('|Npmjs: npmjs.org/package/konata-desktop ~   |');
console.log('|(too many "~"? I just want to be cute ok ?  |');
console.log('|No virus in this one :)                     |');
console.log('|============================================|');


console.log('\x1b[32m%s\x1b[0m', 'Hi~ Thanks for using this application~~');

const supportedPlatforms = ['darwin', 'linux'];
if (!supportedPlatforms.includes(process.platform)) {
  console.error('\x1b[31m%s', `Your os (${process.platform}) isn't supported.`);
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
    console.error('\x1b[31m%s\x1b[0m', `Page loading failed : ${errorDescription}`); 
  });

  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('\x1b[31m%s\x1b[0m', 'Browser window crashed.'); 
  });

  mainWindow.on('unresponsive', () => {
    console.error('\x1b[31m%s\x1b[0m', 'Browser window isn\'t responding.'); 
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('load-gif-url', gifUrl);
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
      console.error('\x1b[31m%s\x1b[0m', 'Error while getting the gif:', error); 
    });
});

process.on('uncaughtException', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'Error:', err); 
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
