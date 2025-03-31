const { app, BrowserWindow, ipcMain } = require('electron');
const { format } = require('url');
const path = require('path');
const log = require('fe-logs');
const captureWin = require('./capture');

// 日志
log.setMode('error');
log.setName('.electron-capture-log.txt');

const winURL = format({
    protocol: 'file',
    slashes: true,
    pathname: path.join(__dirname, '../renderer/index.html')
});

let win = null;
let windowOption = {
    width: 500,
    minWidth: 500,
    height: 300,
    minHeight: 300,
    useContentSize: true,
    center: true,
    title: '截图工具',
    webPreferences: {
        devTools: true, 
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preloader/preload.js'),
    }
}

function createWindow() {
    win = new BrowserWindow(windowOption)
    win.loadURL(winURL);
    
    // 开发环境下打开开发者工具
    if (process.env.NODE_ENV === 'development') {
        win.webContents.openDevTools();
    }
    
    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', () => {
    createWindow();
    captureWin(win);
    
    // 注册IPC事件处理
    ipcMain.on('launch', (event, status) => {
        app.setLoginItemSettings({
            openAtLogin: !!status
        });
    });
    
    ipcMain.on('is-hide-windows', (event, status) => {
        // 将隐藏窗口状态传递给capture模块
        if (win) {
            win.webContents.send('update-hide-status', status);
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});