import React from 'react';
import { remote, ipcRenderer } from 'electron';
import './index.scss';
import '../../common/comment-core-library/CommentCoreLibrary.js'
import '../../common/comment-core-library/style.css'

export default class SelfDanmu extends React.Component {
    constructor() {
        super();
        this.state = {}
    }

    componentDidMount() {
        document.title = '直播酱彩色弹幕';
        this.initWindow();
        this.initCM();
    }

    // 设置弹幕滚动框架
    initCM() {
        window.CM = new window.CommentManager(document.getElementById('my-comment-stage'));
        window.CM.init();
        // 启动播放弹幕（在未启动状态下弹幕不会移动）
        window.CM.start();
        // 重置大小
        let win = remote.getCurrentWindow();
        win.on('resize', () => {
            window.CM.setBounds();
        })
    }

    initWindow() {
        ipcRenderer.once('home-post', (e, arg) => {
            const { whiteList } = arg;
            this.listenWebSocketMsg(whiteList);
        })
        const windowId = ipcRenderer.sendSync('getWindow', { windowName: 'home' })
        let homeDanmuWindow = remote.BrowserWindow.fromId(windowId);
        homeDanmuWindow.webContents.send('color-danmu-mounted');
    }

    listenWebSocketMsg(whiteList) {
        console.log(whiteList)
        const that = this;
        remote.getGlobal('emitter').on('websocket-message', (msg) => {
            switch (msg.type) {
                case 'danmaku.message':
                    console.log(msg.data)
                    if(/comment/gi.test(msg.data.type) && whiteList.includes(msg.data.user.name)) {
                        window.CM.send({
                            "mode": 6,
                            "text": msg.data.comment,
                            "stime": 1000,
                            "size": 28,
                            "color": 0xff0000
                        })
                    }
                    break;
                case 'newFans':
                    console.log('有新的粉丝');
                    console.log(msg.data);
                    break;
                case 'info':
                    console.log('直播间信息');
                    console.log(msg);
                    break;
            }
        })
    }

    render() {
        return (
            <div className="color-danmu-page">
                <div id='my-player' className='abp'>
                    <div id='my-comment-stage' className='container'></div>
                </div>
            </div>
        );
    }
}
