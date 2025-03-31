const { contextBridge, ipcRenderer } = require('electron');

// 暴露给渲染进程的API
contextBridge.exposeInMainWorld('myAPI', {
    version: process.version,
    cutScreen: () => {
        ipcRenderer.send('cut-screen');
    }
});

// 暴露ipcRenderer给渲染进程
contextBridge.exposeInMainWorld('ipcRenderer', {
    on: (channel, func) => {
        // 白名单通道
        const validChannels = ['popup-tips', 'has-click-cut', 'update-hide-status'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    send: (channel, data) => {
        // 白名单通道
        const validChannels = [
            'cut-screen', 
            'setCaptureKey', 
            'setShowKey', 
            'launch', 
            'is-hide-windows',
            'insert-canvas',
            'linux-clipboard'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    }
});