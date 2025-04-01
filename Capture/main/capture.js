const { globalShortcut, ipcMain, clipboard, nativeImage } = require('electron');
const Screenshots = require('electron-screenshots');
const path = require('path');

const { app } = require('electron');

// 平台检测
const islinux = process.platform === 'linux';

/**
 * 截图主控制器
 * @param {BrowserWindow} mainWindow - 主窗口引用
 */
function captureController(mainWindow) {
    // 保存主窗口引用
    global.IMwindow = mainWindow;
    
    // 默认隐藏设置
    global.isCutHideWindows = false;
    
    // 初始化快捷键
    let cutKey = '';
    let showKey = '';
    
    // 创建截图实例
    const screenshots = new Screenshots({
        // 指定快捷键（阻止重复实例化）
        singleInstanceLock: true,
    });
    
    // 监听截图完成事件
    screenshots.on('ok', (e, buffer, bounds) => {
        console.log('Screenshot Completed:', bounds);
        
        // 创建临时图片文件
        const imgPath = path.join(app.getPath('temp'), `screenshot-${Date.now()}.png`);
        
        // 将截图写入系统剪贴板
        clipboard.writeImage(nativeImage.createFromBuffer(buffer));
        
        // 恢复主窗口显示
        if (global.isCutHideWindows && mainWindow) {
            mainWindow.show();
        }
        
        // 通知渲染进程截图已完成
        mainWindow.webContents.send('popup-tips');
        
        // 恢复点击状态
        mainWindow.webContents.send('has-click-cut', false);
    });
    
    // 监听截图取消事件
    screenshots.on('cancel', () => {
        console.log('截图取消');
        
        // 恢复主窗口显示
        if (global.isCutHideWindows && mainWindow) {
            mainWindow.show();
        }
        
        // 恢复点击状态
        mainWindow.webContents.send('has-click-cut', false);
    });
    
    // 监听截图错误事件
    screenshots.on('error', (error) => {
        console.error('截图错误:', error);
        
        // 恢复主窗口显示
        if (global.isCutHideWindows && mainWindow) {
            mainWindow.show();
        }
        
        // 恢复点击状态
        mainWindow.webContents.send('has-click-cut', false);
    });
    
    // 开始截图的IPC处理
    ipcMain.on('cut-screen', () => {
        
        // 如果设置了隐藏窗口，则先隐藏
        if (global.isCutHideWindows && mainWindow) {
            if (mainWindow.isFullScreen()) {
                mainWindow.setFullScreen(false);
            }
            mainWindow.hide();
        }
        
        // 开始截图
        screenshots.startCapture();
    });
    
    // 设置截图快捷键
    ipcMain.on('setCaptureKey', (event, key) => {
        try {
            // 注销旧快捷键
            if (cutKey) {
                globalShortcut.unregister(cutKey);
            }
            
            cutKey = key;
            
            // 注册新快捷键
            if (key) {
                globalShortcut.register(key, () => {
                    // 如果设置了隐藏窗口，则先隐藏
                    if (global.isCutHideWindows && mainWindow) {
                        if (mainWindow.isFullScreen()) {
                            mainWindow.setFullScreen(false);
                        }
                        mainWindow.hide();
                    }
                    
                    // 开始截图
                    screenshots.startCapture();
                });
            }
        } catch (error) {
            console.error('设置快捷键失败:', error);
        }
    });
    
    // 设置显示快捷键
    ipcMain.on('setShowKey', (event, key) => {
        try {
            // 注销旧快捷键
            if (showKey) {
                globalShortcut.unregister(showKey);
            }
            
            showKey = key;
            
            // 注册新快捷键
            if (key) {
                globalShortcut.register(key, () => {
                    if (mainWindow) {
                        if (mainWindow.isVisible()) {
                            mainWindow.hide();
                        } else {
                            mainWindow.show();
                        }
                    }
                });
            }
        } catch (error) {
            console.error('设置显示快捷键失败:', error);
        }
    });
    
    // 设置是否隐藏窗口
    ipcMain.on('is-hide-windows', (event, status) => {
        global.isCutHideWindows = !!status;
    });
    
    // Linux系统特殊处理
    if (islinux) {
        ipcMain.on('linux-clipboard', (event, dataUrl) => {
            if (dataUrl) {
                clipboard.writeImage(nativeImage.createFromDataURL(dataUrl));
            }
        });
    }
    
    // 清理资源
    mainWindow.on('closed', () => {
        screenshots.removeAllListeners();
    });
    
    // 截图直接插入到主窗口
    ipcMain.on('insert-canvas', () => {
        if (mainWindow) {
            mainWindow.webContents.send('popup-tips');
        }
    });
}

module.exports = captureController;