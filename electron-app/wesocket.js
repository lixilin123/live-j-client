/**
 * 描述：该文件集成了websocket的打开、广播、关闭
 */
const { ipcMain } = require('electron'),
    WebSocket = require('ws'),
    EventEmitter = require('events');
global.emitter = new EventEmitter();
// 定义ws存储当前websocket连接；
let ws;

// 打开websocket
const openWS = (token) => {
    if (ws) return;

    // websocket心跳机制
    const heartbeat = () => {
        console.log('收到ping')
        clearTimeout(ws.pingTimeout);
        ws.pingTimeout = setTimeout(() => {
            ws.terminate();
        }, 5000 + 1000);
    }

    // ws = new WebSocket("ws://10.10.28.162:3002");
    ws = new WebSocket("ws://yishisi.cn:8005");
    ws.on('open', () => {
        console.log('客户端——服务端：WS连接已打开');
        heartbeat()
        ws.send(JSON.stringify({
            type: 'open',
            token: token
        }));
        setInterval(() => {
            ws.send(JSON.stringify({
                type: 'updateVipStatus',
                token: token
            }));
        }, 60000)
    });
    ws.on('message', (msg) => {
        const parseMsg = JSON.parse(msg);
        switch (parseMsg.type) {
            case 'updateVipStatus':
                global.emitter.emit('updateVipStatus', parseMsg.data);
                break;
            case 'danmaku.connect':
                console.log('正在连接至弹幕服务器');
                break;
            case 'danmaku.connected':
                console.log('成功连接至弹幕服务器');
                break;
            case 'danmaku.message':
                console.log(parseMsg)
                global.emitter.emit('websocket-message', parseMsg);
                break;
            case 'danmaku.close':
                console.log('已断开与弹幕服务器的连接');
                break;
            case 'danmaku.error':
                console.log('与弹幕服务器的连接出现错误');
                global.emitter.emit('websocket-error-server');
                break;
            case 'newFans':
                console.log('有新的粉丝');
                console.log(parseMsg);
                global.emitter.emit('websocket-message', parseMsg);
                break;
            case 'info':
                console.log('直播间信息');
                console.log(parseMsg);
                global.emitter.emit('websocket-message', parseMsg);
                break;
        }
    });
    ws.on('ping', heartbeat)
    ws.on('close', () => {
        clearTimeout(ws.pingTimeout);
    })
    ws.on('error', () => {
        global.emitter.emit('websocket-error-client');
    })
}

// 监听渲染进程发出的websocket操作，在主进程中完成
const websocketListen = () => {
    ipcMain.on('openWS', (event, token) => {
        openWS(token);
    })
}

module.exports = websocketListen;
