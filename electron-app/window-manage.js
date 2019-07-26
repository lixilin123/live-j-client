const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 1.定义一个空对象，用来存储窗口
global.windowManage = {};

/**
 * 2.封装创建窗口的方法
 * @param {String} windowName 将要创建的窗口名字 
 * @param {Object} initConfig 用于初始化窗口的参数对象
 */
const createWindow = (windowName, initConfig) => {
    global.windowManage[windowName] = new BrowserWindow(initConfig);
    // global.windowManage[windowName].loadURL(`http://10.10.28.162:3000/index.html#/${windowName}`);
    global.windowManage[windowName].loadURL(`file://${path.join(__dirname, '../build/index.html#/' + windowName).replace(/\\/g, '/')}`);
    // 打开调试
    // global.windowManage[windowName].webContents.openDevTools();
};

// 3.监听渲染进程发出的窗口操作，在主进程中完成
const windowManageListen = () => {
    // 创建单个窗口
    ipcMain.on('createWindow', (event, arg) => {
        createWindow(arg.windowName, arg.initConfig);
        event.returnValue = 'createWindowDone'
    })
    // 获取单个窗口
    ipcMain.on('getWindow', (event, arg) => {
        let win = global.windowManage[arg.windowName];
        event.returnValue = win ? win.id : false;
    })
    // 获取所有窗口的个数
    ipcMain.on('getAllWindowsNum', event => {
        event.returnValue = BrowserWindow.getAllWindows().length;
    })
    // 关闭单个窗口
    ipcMain.on('closeWindow', (event, windowName) => {
        if(global.windowManage[windowName]) {
            global.windowManage[windowName].close();
            delete global.windowManage[windowName];
        }
    })
    // 关闭所有窗口
    ipcMain.on('closeAllWindows', () => {
        BrowserWindow.getAllWindows().forEach(win => {
            win.close();
        })
    })
}

module.exports = { createWindow, windowManageListen}
