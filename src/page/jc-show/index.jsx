import React from 'react';
import { remote, ipcRenderer } from 'electron';
import Store from '../../store/store.js';
import './index.scss';

const store = new Store({
    configName: 'userData',
    defaults: {}
});
export default class JcShow extends React.Component {
    constructor() {
        super();
        this.state = {
            jcStatus: 0, // 0,还未开始竞猜 1,正在竞猜 2,竞猜结束
            topic: '',
            optionPositive: '',
            optionNegative: '',
            matchPositive: '',
            matchNegative: '',

            rankList: [],

            positiveLength: 0,
            negativeLength: 0
        }
    }

    componentDidMount() {
        document.title = '直播酱竞猜展示';
        this.initWindow();
        this.initRank();
    }

    initWindow() {
        const windowId = ipcRenderer.sendSync('getWindow', { windowName: 'home' })
        let homeDanmuWindow = remote.BrowserWindow.fromId(windowId);
        homeDanmuWindow.webContents.send('jc-show-mounted');
        ipcRenderer.on('jcInfo', (e, arg) => {
            console.log('jc-show 收到了 jcInfo')
            console.log(arg)
            const state = Object.assign(this.state, arg);
            this.setState(state)
        })

        ipcRenderer.on('jcRealTimeInfo', (e, arg) => {
            console.log('jc-show 收到了 jcRealTimeInfo')
            console.log(arg)
            const state = Object.assign(this.state, arg);
            this.setState(state)
        })
    }

    initRank() {
        let jcData = store.get('jcData');
        if (!jcData || (new Date().toLocaleDateString() != jcData.date)) {
            jcData = {
                date: new Date().toLocaleDateString(),
                json: {}
            }
            store.set('jcData', jcData)
        } else if (Object.keys(jcData.json).length > 0) {
            // 1. 排序
            const jcDataResArr = Object.entries(jcData.json).sort((val1, val2) => val1[1].num - val2[1].num);
            // 2. 获取前几名进行展示
            const willShowArr = jcDataResArr.splice(0, 6);
            this.setState({
                rankList: willShowArr
            })
        }
    }

    render() {
        const wrapperStyle = (this.state.jcStatus != 0 && this.state.rankList.length) ?
            { 'animation': 'jcShowAnimation 10s linear infinite' } :
            {};
        let width = (this.state.positiveLength == 0 & this.state.negativeLength == 0) ? 
            50 : 
            Math.floor(this.state.positiveLength / (this.state.positiveLength + this.state.negativeLength) * 100);
        let proportionLeftWidth = { width: `${width}%` }
        return (
            <div className="jc-show-page">
                <div className="main">
                    <div className="wrapper" style={wrapperStyle}>
                        {this.state.jcStatus != 0 ?
                            <div className="jc-info">
                                <div className="title">{this.state.jcStatus == 1 ? '竞猜中' : '竞猜已截止'}</div>
                                <div className="topic">{this.state.topic}</div>
                                <div className="option">
                                    <span className="left">{this.state.optionPositive}</span>
                                    <span className="right">{this.state.optionNegative}</span>
                                </div>
                                <div className="proportion">
                                    <div className="left" style={proportionLeftWidth}>{this.state.positiveLength}</div>
                                    <div className="right">{this.state.negativeLength}</div>
                                </div>
                                <div className="join-way">
                                    <div className="sub-title">参与指南</div>
                                    <div className="text1">弹幕发送 <span>{this.state.matchPositive}</span> 即押注 <span>{this.state.optionPositive}</span></div>
                                    <div className="text2">弹幕发送 <span>{this.state.matchNegative}</span> 即押注 <span>{this.state.optionNegative}</span></div>
                                </div>
                            </div> :
                            null
                        }
                        {this.state.rankList.length ?
                            <div className="jc-rank">
                                <div className="title">今日竞猜排行</div>
                                <ul>
                                    {this.state.rankList.map((user, index) => {
                                        return (
                                            <li key={index}>
                                                <div className="rank-num">{index + 1}</div>
                                                <div className="name">{user[1].name}</div>
                                                <div className="win">胜{user[1].win}场</div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div> :
                            null
                        }
                    </div>
                </div>
            </div>
        );
    }
}
