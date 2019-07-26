const { app, ipcMain } = require('electron');
const { createWindow, windowManageListen } = require('./window-manage.js');
windowManageListen();
const websocketListen = require('./wesocket.js');
websocketListen();

// 创建登录注册窗口
const createAccountWindow = () => {
    createWindow('account', {
        width: 340,
        height: 530,
        show: false,
        transparent: true,
        frame: false,
        maximizable: false,
        resizable: true,
        webPreferences: {
            nodeIntegration: true
        }
    })
    global.windowManage['account'].on('ready-to-show', () => {
        global.windowManage['account'].show();
    });
}

// app监听
app.on('ready', createAccountWindow);
app.on('window-all-closed', () => {
    app.quit();
});

// app重启
ipcMain.on('relaunch-app', () => {
    app.relaunch();
    app.exit(0);
})

// ================================ app检测更新 ===============================
const { autoUpdater } = require("electron-updater")
// 更新的配置函数
const updateConfig = window => {
    // 监听开启自动更新
    ipcMain.on("checkForUpdate", () => {
        autoUpdater.checkForUpdates();
    })
    // 监听关闭程序重启安装
    ipcMain.on('quitAndInstall', () => {
        autoUpdater.quitAndInstall();
    });
    // 新版程序存放的服务器地址
    autoUpdater.setFeedURL('http://download.yishisi.cn/bilibili-live-j/');


    autoUpdater.on('error', () => {
        window.webContents.send('message', 'error')
    });
    autoUpdater.on('checking-for-update', () => {
        window.webContents.send('message', 'checking-for-update')
    });
    autoUpdater.on('update-available', () => {
        window.webContents.send('message', 'update-available')
    });
    autoUpdater.on('update-not-available', () => {
        window.webContents.send('message', 'update-not-available')
    });
    autoUpdater.on('download-progress', progressObj => {
        window.webContents.send('download-progress', progressObj)
    })


    // 监听更新下载完毕
    autoUpdater.on('update-downloaded', () => {
        window.webContents.send('isUpdateNow')
    });
    // 告诉render配置完毕
    window.webContents.send('updateConfiged')
}
// 监听是否执行更新配置函数
ipcMain.on('updateConfig', () => {
    updateConfig(global.windowManage['home'])
})
