const { contextBridge, ipcRenderer, desktopCapturer } = require('electron');

contextBridge.exposeInMainWorld('myAPI', {
    version: process.version,
    cutScreen: () => {
        ipcRenderer.send('cut-screen')
    },
    captureScreen: async (options = {}) => {
        try {
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: options.thumbnailSize
            });
            return sources;
        } catch (error) {
            console.error('捕获屏幕失败:', error);
            return { error: error.message };
        }
    }
})