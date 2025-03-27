const { app, BrowserWindow } = require('electron');
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
        nodeIntegration: true 
    }
}
function createWindow() {
    win = new BrowserWindow(windowOption)
    win.loadURL(winURL);
}


app.on('ready', () => {
    createWindow();
    captureWin(win);
});