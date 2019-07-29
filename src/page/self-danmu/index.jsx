import React from 'react';
import { observer } from 'mobx-react';
import state from '../../common/mobx-store.js'
import { remote, ipcRenderer } from 'electron';
import './index.scss';
import '../../common/comment-core-library/CommentCoreLibrary.js'
import '../../common/comment-core-library/style.css'

@observer
class SelfDanmu extends React.Component {
    constructor() {
        super();
        this.state = {
            newFans: 0,
            giftRgHeight: '180px'
        }
        this.LiveRoom = null;
        this.danmakuCount = 0;
        this.isResizing = false;
        // 弹幕栈
        this.danmuStack = [];
    }

    componentDidMount() {
        document.title = '直播酱弹幕展示';
        this.initWindow();
        this.addResizeEvent();
        this.intervalShowDanmu();
        this.updateNewFans();
    }

    initWindow() {
        ipcRenderer.once('home-post', (e, arg) => {
            const { gztx, jrtx, bxslttx, pbxdsdm, sliderValue } = arg;
            this.gztx = gztx;
            this.jrtx = jrtx;
            this.bxslttx = bxslttx;
            this.pbxdsdm = pbxdsdm;
            this.setState({ sliderValue });
            this.listenWebSocketMsg();
        })
        const windowId = ipcRenderer.sendSync('getWindow', { windowName: 'home' })
        let homeDanmuWindow = remote.BrowserWindow.fromId(windowId);
        homeDanmuWindow.webContents.send('self-danmu-mounted');
    }

    // 监听WS
    listenWebSocketMsg() {
        let that = this;
        remote.getGlobal('emitter').on('websocket-message', (msg) => {
            switch (msg.type) {
                case 'danmaku.message':
                    console.log(msg.data)
                    that.storageDanmuInfo(msg.data);
                    break;
                case 'newFans':
                    console.log('有新的粉丝');
                    console.log(msg.data);
                    break;
                case 'info':
                    console.log('直播间信息');
                    console.log(msg);
                    that.setState({ roomInfo: msg.data });
                    break;
            }
        })
    }

    // 存储弹幕信息
    storageDanmuInfo(msg, callback) {
        // 定义并赋值type
        let type;
        if (msg.type == 'gift') {
            type = 'gift';
            // 过滤辣条
            if (this.bxslttx && msg.gift.name == '辣条') return;
        } else if (['comment', 'newFans', 'welcome', 'welcomeGuard', 'ENTRY_EFFECT', 'SYS_MSG'].includes(msg.type)) { // 未知: 'COMBO_SEND', 'COMBO_END'
            type = 'danmu';
            // 过滤关注提醒、进入提醒、小电视
            if (!this.gztx && msg.type == 'newFans') return;
            if (!this.jrtx && ['welcome', 'welcomeGuard', 'ENTRY_EFFECT'].includes(msg.type)) return;
            if (this.pbxdsdm && msg.comment && msg.comment == '哔哩哔哩 (゜-゜)つロ 干杯~') return;
        } else {
            type = msg.type
        }
        // 存储弹幕到栈
        if (['gift', 'danmu'].includes(type)) {
            msg.keyCount = `${this.danmakuCount++}`;
            msg.lltype = type;
            this.danmuStack.push(msg);
        } else {
            state.danmuPool[type] = msg;
        }
    }

    // 更新本次直播新增粉丝数
    updateNewFans() {
        ipcRenderer.on('newFans', (e, newFans) => {
            this.setState({newFans})
        })
    }

    // 定时器，有规律的渲染页面，防止高并发导致弹幕显示空白
    intervalShowDanmu() {
        window.setInterval(() => {
            if(this.danmuStack.length) {
                const danmuItem = this.danmuStack.splice(0,1)[0];
                state.danmuPool[danmuItem.lltype].push(danmuItem);
            }
        }, 200)
    }

    // 设置礼物、弹幕区域可调整大小
    addResizeEvent() {
        let handle = document.querySelector('.drag-line');
        handle.addEventListener('mousedown', () => {
            this.isResizing = true;
        });
        document.addEventListener('mousemove', (e) => {
            if (!this.isResizing) return;
            this.setState({
                giftRgHeight: `${e.clientY - 30}px`
            })
        })
        document.addEventListener('mouseup', (e) => {
            this.isResizing = false;
        })
    }

    render() {
        let pageStyle = { background: `rgba(0, 0, 0, ${this.state.sliderValue ? (this.state.sliderValue / 100) : 1})` }
        return (
            <div className="self-danmu-page" style={pageStyle}>
                <div className="head">
                    <div className="live-audience">人气值: {state.danmuPool.online ? state.danmuPool.online.number : 0}</div>
                    <div className="new-fans">本次新增粉丝数: {this.state.newFans}</div>
                </div>
                <div className="main-content">
                    <div className="gift-region" style={{ height: this.state.giftRgHeight }}>
                        <div className="region-title">礼物提醒区</div>
                        <div className="ul-wrapper">
                            <ul>
                                {state.danmuPool.gift && state.danmuPool.gift.map((val, index) => {
                                    return (
                                        <li key={val.keyCount}>
                                            <span className='audience-name'>{val.user.name}</span>
                                            赠送了
                                        <span className='gift-name'> {val.gift.name} </span>
                                            x{val.gift.count}
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                    <div className="danmu-region">
                        <div className="drag-line"></div>
                        <div className="region-title">弹幕提醒区</div>
                        <div className="ul-wrapper">
                            <ul>
                                {state.danmuPool.danmu && state.danmuPool.danmu.map((val, index) => {
                                    if (val.type == 'comment') {
                                        return (
                                            <li key={val.keyCount}>
                                                <span className='audience-name'>{val.user.name}</span>
                                                : {val.comment}
                                            </li>
                                        )
                                    } else if (val.type == 'newFans') {
                                        return (
                                            <li key={val.keyCount}>
                                                <span className='audience-name'>{val.user.name}</span>
                                                关注了直播间
                                        </li>
                                        )
                                    } else if (val.type == ('welcome' || 'welcomeGuard' || 'ENTRY_EFFECT')) {
                                        return (
                                            <li key={val.keyCount}>
                                                {val.type == 'ENTRY_EFFECT' ?
                                                    <span className='audience-name red-name'>【舰长】{val.data.copy_writing.match(/<%.*%>/g)[0].replace(/(<%|%>)/g, '')}</span> :
                                                    <span className='audience-name'>{val.user.name}</span>
                                                }
                                                进入了直播间
                                        </li>
                                        )
                                    } else {
                                        return null;
                                    }
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default SelfDanmu;
