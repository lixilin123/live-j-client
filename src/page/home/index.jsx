import React from 'react';
import { remote, ipcRenderer } from 'electron';
import config from '../../common/config';
import Store from '../../store/store.js';
import net from '../../common/net.js';
import { formatVipEndTime } from '../../common/util.js'

// 图片
import qqQrcode from '../../img/qq.png';
import vipIcon from '../../img/vip-icon.png';
// 样式，组件
import './index.scss'
import './switch.scss'
import Dialog from '../../component/dialog/index';
import Loading from '../../component/loading/index';
import Toast from '../../component/toast/index';
import Switch from 'rc-switch';
// 滑动条
import './slider.css';
import Slider from 'rc-slider';
import { returnStatement } from '@babel/types';
const Handle = Slider.Handle;
const store = new Store({
    configName: 'userData',
    defaults: {}
});
export default class Home extends React.Component {
    constructor() {
        super();
        this.state = {
            avatar: 'https://i0.hdslb.com/bfs/article/13064150e03455529c024c7ef0a5b61af4c86be3.jpg',
            menuConfig: config.menuConfig,
            isVip: false,
            newerWelfare: 1,
            activeMenuName: '弹幕显示设置',
            // activeMenuName: '会员支付',
            selfDanmuSwitch: false,
            colorDanmuSwitch: false,
            // 个性化设置
            gztx: true,
            jrtx: true,
            bxslttx: false,
            pbxdsdm: false,
            sliderShow: false,
            sliderValue: 50,
            // 弹幕竞猜
            topic: '',
            optionPositive: '',
            optionNegative: '',
            matchPositive: '',
            matchNegative: '',
            jcItem: {
                positive: [],
                negative: []
            },
            jcTime: '3',
            jcMainBtnStatus: 0, // 0,还未开始竞猜 1,正在竞猜 2,竞猜结束
            jcModal: false,
            jcChooseResStatus: 0, // 0,未选择 1,选择正方答案 2,选择反方答案
            // 彩色弹幕
            whiteListInput: '',
            whiteList: [],
            // 会员支付
            // vipActiveMenuName: '普通会员',
            vipConfig: [],
            vipSeleted: 0,
            payModalNeedToKnow: false
        }
        // this.isMaximize = false
        this.acitveMenuCategory = 0;
        this.acitveMenuName = 0;
        this.selfDamuWidth = 350;
        this.selfDamuHeight = 600;
        this.personalizedSetting = config.personalizedSetting;
        this.previewGift = config.previewGift;
        this.previewDanmu = config.previewDanmu;
        this.jcItem = {
            positive: [],
            negative: [],
            totalObj: {}
        };
        this.newFans = 0;
    }

    componentDidMount() {
        document.title = '直播酱首页';
        // 检测更新
        this.update();
        // 打开websocket
        this.openWS(store.get('token'));
        // 监听websocket
        this.listenWebSocketMsg();
        // 页面初始化
        this.init();
        // 会员配置信息初始化
        this.getVipConfig();
    }

    // 检测是否需要更新
    update() {
        // 告诉main开始配置更新
        ipcRenderer.send("updateConfig");
        // 监听更新配置完毕后，执行自动更新
        ipcRenderer.on("updateConfiged", () => {
            console.log('updateConfiged')
            ipcRenderer.send("checkForUpdate");
        });
        // 监听自动更新完成后，提示用户重启安装
        ipcRenderer.on("isUpdateNow", () => {
            console.log("isUpdateNow")
            this.getUpdateContent();
        });
        // 打印
        ipcRenderer.on("message", (e, msg) => {
            console.log(msg)
        });
        ipcRenderer.on("download-progress", (e, obj) => {
            console.log(`下载百分比：${obj.percent}`)
        });
    }

    // 获取更新具体内容
    async getUpdateContent() {
        const { updateContent } = await net.getUpdateContent();
        this.setState({
            updateContent,
            showUpdataModal: true
        })
    }

    // 重启更新
    quitAndInstall() {
        ipcRenderer.send("quitAndInstall");
    }

    // 页面初始化
    async init() {
        const param = {
            token: store.get('token')
        }
        const res = await net.init(param);
        if (res.code == 0) {
            this.setState({
                name: res.data.name,
                roomId: res.data.room_id,
                whiteList: res.data.color_white_list ? res.data.color_white_list.split('，') : [],
                isVip: res.data.is_vip,
                vipEndTime: res.data.vip_end_time ? formatVipEndTime(res.data.vip_end_time) : null,
                newerWelfare: res.data.newer_welfare
            })
        } else {
            Toast('warning', '初始化失败')
        }

        // 获取selfDanmu之前的设置
        const selfDanmuPersonalSet = store.get('selfDanmuPersonalSet');
        if (selfDanmuPersonalSet) {
            const { gztx, jrtx, bxslttx, pbxdsdm, sliderValue } = JSON.parse(selfDanmuPersonalSet);
            this.setState({ gztx, jrtx, bxslttx, pbxdsdm, sliderValue, sliderShow: true });
        } else {
            this.setState({ sliderShow: true })
        }
        const selfDanmuWH = store.get('selfDanmuWH');
        if (selfDanmuWH) {
            const { width, height } = JSON.parse(selfDanmuWH);
            this.selfDamuWidth = width;
            this.selfDamuHeight = height;
        }
    }

    // 打开websockt
    openWS(token) {
        ipcRenderer.send('openWS', token);
        remote.getGlobal('emitter').on('websocket-error-server', () => {
            Dialog({
                content: '服务器打瞌睡了😥',
                confirmBtnText: '关闭应用',
                confirmHandle: () => {
                    remote.getCurrentWindow().close();
                },
                hideCancelBtn: true
            })
        })
        remote.getGlobal('emitter').on('websocket-error-client', () => {
            Dialog({
                content: '连接服务器时出现错误😥',
                confirmBtnText: '立即重启',
                confirmHandle: () => {
                    ipcRenderer.send('relaunch-app')
                },
                hideCancelBtn: true
            })
        })
    }

    // 监听websockt
    listenWebSocketMsg() {
        let that = this;
        remote.getGlobal('emitter').on('websocket-message', msg => {
            if (that.jcStart && msg.type == 'danmaku.message' && msg.data.type == 'comment') {
                const uid = msg.data.user.id,
                    name = msg.data.user.name;
                // 如果此人已经参与了竞猜，不对比弹幕信息，直接返回
                if (that.jcItem.totalObj[uid]) return;
                if (msg.data.comment == that.state.matchPositive) {
                    console.log('有人选择了正方');
                    console.log(msg.data);
                    that.jcItem.totalObj[uid] = name;
                    that.jcItem.positive.push({ uid, name })
                    return;
                }
                if (msg.data.comment == that.state.matchNegative) {
                    console.log('有人选择了反方')
                    console.log(msg.data)
                    that.jcItem.totalObj[uid] = name;
                    that.jcItem.negative.push({ uid, name })
                    return;
                }
                // if (msg.data.comment.includes(that.state.matchPositive)) {
                //     console.log('有人选择了正方');
                //     console.log(msg.data);
                //     that.jcItem.totalObj[uid] = name;
                //     that.jcItem.positive.push({ uid, name })
                //     return;
                // }
                // if (msg.data.comment.includes(that.state.matchNegative)) {
                //     console.log('有人选择了反方')
                //     console.log(msg.data)
                //     that.jcItem.totalObj[uid] = name;
                //     that.jcItem.negative.push({ uid, name })
                //     return;
                // }
            }
            if (msg.type == 'newFans') {
                this.newFans++;
                const selfDanmuWindowId = ipcRenderer.sendSync('getWindow', { windowName: 'selfDanmu' })
                if(selfDanmuWindowId) {
                    const selfDanmuWindow = remote.BrowserWindow.fromId(selfDanmuWindowId);
                    console.log(this.newFans)
                    selfDanmuWindow.webContents.send('newFans', this.newFans)
                }
            }
        })
        remote.getGlobal('emitter').on('updateVipStatus', data => {
            this.setState({
                isVip: data.is_vip,
                vipEndTime: data.vip_end_time ? formatVipEndTime(data.vip_end_time) : null,
                newerWelfare: data.newer_welfare
            })
            if (!data.is_vip) {
                const colorDanmuWindowId = ipcRenderer.sendSync('getWindow', { windowName: 'colorDanmu' });
                if (colorDanmuWindowId) ipcRenderer.send('closeWindow', 'colorDanmu');
                const jcShowWindowId = ipcRenderer.sendSync('getWindow', { windowName: 'jcShow' });
                if (jcShowWindowId) ipcRenderer.send('closeWindow', 'jcShow');
            }
        })
    }

    // 菜单切换
    menuClick(index1, index2) {
        let menuConfig = [... this.state.menuConfig];
        menuConfig[this.acitveMenuCategory].list[this.acitveMenuName].active = false;
        menuConfig[index1].list[index2].active = true;
        this.setState({
            menuConfig,
            activeMenuName: menuConfig[index1].list[index2].name
        });
        this.acitveMenuCategory = index1;
        this.acitveMenuName = index2;
    }

    // 系统按钮：最小化，最大化，关闭
    appBtnClick(type) {
        const currentWindow = remote.getCurrentWindow();
        switch (type) {
            case 'minimize':
                currentWindow.minimize();
                break;
            // case 'maximize':
            //   if (this.isMaximize) {
            //     this.isMaximize = false;
            //     currentWindow.unmaximize();
            //   } else {
            //     this.isMaximize = true;
            //     currentWindow.maximize();
            //   }
            //   break;
            case 'close':
                // 获取目前窗口的数量
                const allWindowsNum = ipcRenderer.sendSync('getAllWindowsNum');
                if (allWindowsNum > 1) {
                    // 有多个窗口
                    if (store.get('alwaysCloseAllWindows')) {
                        // 直接关闭所有
                        ipcRenderer.send('closeAllWindows');
                    } else {
                        // 询问一下用户，再关
                        Dialog({
                            content: '确定关闭所有窗口吗？',
                            cancelBtnText: '取消',
                            confirmBtnText: '总是关闭所有',
                            confirmHandle: () => {
                                store.set('alwaysCloseAllWindows', '1')
                                ipcRenderer.send('closeAllWindows')
                            },
                            hideCancelBtn: false
                        })
                    }
                } else {
                    // 有一个主窗口
                    ipcRenderer.send('closeWindow', 'home');
                }
                break;
        }
    }

    // 个性化设置（switch切换）
    selfDanmuSwitchChange(value) {
        this.setState({ selfDanmuSwitch: value })
        if (value) {
            this.createSelfDanmuWindow();
        } else {
            ipcRenderer.send('closeWindow', 'selfDanmu');
        }
    }

    // 个性化设置（开启）
    createSelfDanmuWindow() {
        const { gztx, jrtx, bxslttx, pbxdsdm, sliderValue } = this.state;
        store.set('selfDanmuPersonalSet', JSON.stringify({ gztx, jrtx, bxslttx, pbxdsdm, sliderValue }))
        ipcRenderer.sendSync('createWindow', {
            windowName: 'selfDanmu',
            initConfig: {
                width: this.selfDamuWidth,
                height: this.selfDamuHeight,
                minWidth: 300,
                minHeight: 400,
                maxWidth: 500,
                show: false,
                frame: false,
                transparent: true,
                resizable: true,
                alwaysOnTop: true,
                webPreferences: {
                    nodeIntegration: true
                }
            }
        });
        const windowId = ipcRenderer.sendSync('getWindow', { windowName: 'selfDanmu' })
        let selfDanmuWindow = remote.BrowserWindow.fromId(windowId);
        // 1.创建
        ipcRenderer.once('self-danmu-mounted', () => {
            console.log('self-danmu-mounted')
            selfDanmuWindow.webContents.send('home-post', {
                gztx,
                jrtx,
                bxslttx,
                pbxdsdm,
                sliderValue
            })
        })
        // 2.显示
        selfDanmuWindow.on('ready-to-show', () => {
            selfDanmuWindow.show();
            // 设置定时器，每10s将该窗口置顶一次
            window.selfDanmuAlwaysOnTopTimer = setInterval(() => {
                selfDanmuWindow.setAlwaysOnTop(true);
            }, 10000);
        });

        // 3.监听窗口大小变化，进行存储
        let timer;
        selfDanmuWindow.on('will-resize', (e, newBounds) => {
            // 防抖函数
            clearTimeout(timer);
            timer = setTimeout(() => {
                this.selfDamuWidth = newBounds.width;
                this.selfDamuHeight = newBounds.height;
                store.set('selfDanmuWH', JSON.stringify({ width: newBounds.width, height: newBounds.height }))
            }, 3000)
        });
        // 4.关闭
        selfDanmuWindow.on('close', () => {
            // 窗口关闭时，清除置顶定时器的timer
            clearInterval(window.selfDanmuAlwaysOnTopTimer);
            // switch切换
            this.setState({ selfDanmuSwitch: false });
        });
    }

    // 个性化设置（checkbox）
    checkboxClick(val, e) {
        // 如果弹幕处于'打开'状态，则禁止浏览器默认行为，阻止用户设置
        if (this.state.selfDanmuSwitch) {
            Dialog({
                content: '个性化设置前，<br/>请先关闭“显示弹幕”',
                confirmBtnText: '立即关闭',
                confirmHandle: () => {
                    this.selfDanmuSwitchChange(false);
                },
                hideCancelBtn: false
            })
            return;
        }

        this.setState({ [val.id]: e.target.checked });
    }

    // 个性化设置（slider bar手柄）
    sliderHandle(props) {
        const { value, dragging, index, ...restProps } = props;
        return (
            <Handle value={value} {...restProps} />
        );
    };

    // 个性化设置（slider bar change）
    sliderChange(value) {
        this.setState({ sliderValue: value })
    };

    // 弹幕竞猜（输入）
    jcInputChange(type, e) {
        this.setState({ [type]: e.target.value });
    }

    // 弹幕竞猜（主按钮点击）
    jcSaveStart() {
        // 输入校验
        if (!this.state.topic) {
            Toast('warning', '请输入竞猜题目');
            return;
        }
        if (!this.state.optionPositive) {
            Toast('warning', '请输入正方答案');
            return;
        }
        if (!this.state.optionNegative) {
            Toast('warning', '请输入反方答案');
            return;
        }
        if (!this.state.matchPositive || !this.state.matchNegative) {
            Toast('warning', '请输入弹幕匹配');
            return;
        }
        if (!this.state.jcTime || !/^[1-9]{1}[0-9]*$/.test(this.state.jcTime)) {
            Toast('warning', '开盘截止时间只能是大于0的整数');
            return;
        }

        // 如果还没开始竞猜
        if (this.state.jcMainBtnStatus == 0) {
            // 开启竞猜
            Toast('success', '成功开启竞猜')
            this.jcItem = {
                positive: [],
                negative: [],
                totalObj: {}
            };
            this.jcStart = true;
            this.setState({ jcMainBtnStatus: 1 })

            // 开启后，开始定期往竞猜展示面板输送数据；
            window.jcShowRealTimeGetJcNumTimer = setInterval(() => {
                const windowId = ipcRenderer.sendSync('getWindow', { windowName: 'jcShow' });
                const jcShowWindow = remote.BrowserWindow.fromId(windowId);
                jcShowWindow.webContents.send('jcRealTimeInfo', { 
                    positiveLength: this.jcItem.positive.length, 
                    negativeLength: this.jcItem.negative.length 
                })
            }, 3000)
            
            // 竞猜截止时间
            window.setTimeout(() => {
                this.jcStart = false;
                this.setState({ jcMainBtnStatus: 2 });
                // 告诉弹幕竞猜的窗口，竞猜已截止
                const windowId = ipcRenderer.sendSync('getWindow', { windowName: 'jcShow' });
                const jcShowWindow = remote.BrowserWindow.fromId(windowId);
                jcShowWindow.webContents.send('jcInfo', { jcStatus: 2 });
                // 清除竞猜开启后定期输送数据的定时器
                clearInterval(window.jcShowRealTimeGetJcNumTimer);
            }, this.state.jcTime * 60 * 1000);
            // 打开窗口
            this.createjcShowWindow();
            return;
        }

        // 如果正在竞猜中
        if (this.state.jcMainBtnStatus == 1) {
            Toast('warning', '未到开盘截止时间！');
            return;
        }

        // 如果竞猜结束
        if (this.state.jcMainBtnStatus == 2) {
            this.setState({
                jcItem: {
                    positive: this.jcItem.positive,
                    negative: this.jcItem.negative
                },
                jcModal: true
            })
        }

    }

    // 弹幕竞猜（窗口打开）
    createjcShowWindow() {
        const postJcInfo = (window) => {
            let { topic, optionPositive, optionNegative, matchPositive, matchNegative } = this.state;
            window.webContents.send('jcInfo', { jcStatus: 1, topic, optionPositive, optionNegative, matchPositive, matchNegative })
        }

        const windowId = ipcRenderer.sendSync('getWindow', { windowName: 'jcShow' })
        if (windowId) {
            let jcShowWindow = remote.BrowserWindow.fromId(windowId);
            postJcInfo(jcShowWindow);
        } else {
            ipcRenderer.sendSync('createWindow', {
                windowName: 'jcShow',
                initConfig: {
                    width: 260,
                    height: 400,
                    show: false,
                    frame: false,
                    resizable: false,
                    webPreferences: {
                        nodeIntegration: true
                    }
                }
            });
            const windowId = ipcRenderer.sendSync('getWindow', { windowName: 'jcShow' });
            let jcShowWindow = remote.BrowserWindow.fromId(windowId);
            jcShowWindow.on('ready-to-show', () => {
                jcShowWindow.show();
            });
            ipcRenderer.once('jc-show-mounted', () => {
                console.log('竞猜窗口加载好了')
                postJcInfo(jcShowWindow)
            })
            jcShowWindow.on('close', () => {
                ipcRenderer.send('closeWindow', 'jcShow');
            });
        }
    }

    // 弹幕竞猜（主播选择竞猜结果）
    chooseJcRes(chooseRes) {
        this.setState({ jcChooseResStatus: chooseRes })
    }

    // 弹幕竞猜（模态框确定）
    jcModalConfirm() {
        // 校验选择结果
        if (this.state.jcChooseResStatus == 0) {
            Toast('warning', '请选择最终结果！');
            return;
        }

        // 更新home页样式
        this.setState({
            jcMainBtnStatus: 0,
            jcModal: false,
            jcChooseResStatus: 0
        })
        // 告诉弹幕竞猜的窗口，竞猜已结束
        const windowId = ipcRenderer.sendSync('getWindow', { windowName: 'jcShow' });
        if (windowId) {
            let jcShowWindow = remote.BrowserWindow.fromId(windowId);
            jcShowWindow.webContents.send('jcInfo', { jcStatus: 0 })
        }

        // 开始结算
        Loading(true, '结算中');
        // 1. 获取之前存储的竞猜数据（初始化逻辑放到了jc-show页面）
        let jcData = store.get('jcData') || {json:{}};
        // 2. 更新竞猜数据
        let jcItemResArr = this.state.jcChooseResStatus == 1 ? this.jcItem.positive : this.jcItem.negative;
        jcItemResArr.forEach((user, index) => {
            if (jcData.json[user.uid]) {
                jcData.json[user.uid].win++;
            } else {
                jcData.json[user.uid] = {
                    name: user.name,
                    win: 1
                }
            }
        })
        // 3. 给更新后的数据排序
        const jcDataResArr = Object.entries(jcData.json).sort((val1, val2) => val1[1].num - val2[1].num);
        // 4. 获取前几名进行展示
        const willShowArr = jcDataResArr.splice(0, 6);
        if (windowId) {
            let jcShowWindow = remote.BrowserWindow.fromId(windowId);
            jcShowWindow.webContents.send('jcInfo', {
                rankList: willShowArr
            })
        }
        // 5. 将更新后的数据再次存储
        store.set('jcData', jcData);
        Loading(false);
        Toast('success', '成功结束竞猜');
    }

    // 弹幕竞猜（模态框取消）
    jcModalCancel() {
        this.setState({
            jcModal: false,
            jcChooseResStatus: 0
        })
    }

    // 彩色弹幕（switch切换）
    colorDanmuSwitchChange(value) {
        this.setState({ colorDanmuSwitch: value })
        if (value) {
            this.createColorDanmuWindow();
        } else {
            ipcRenderer.send('closeWindow', 'colorDanmu');
        }
    }

    // 彩色弹幕（开启）
    createColorDanmuWindow() {
        ipcRenderer.sendSync('createWindow', {
            windowName: 'colorDanmu',
            initConfig: {
                width: 900,
                height: 600,
                show: false,
                frame: false,
                resizable: true,
                webPreferences: {
                    nodeIntegration: true
                }
            }
        });
        const windowId = ipcRenderer.sendSync('getWindow', { windowName: 'colorDanmu' })
        let colorDanmuWindow = remote.BrowserWindow.fromId(windowId);
        ipcRenderer.once('color-danmu-mounted', () => {
            const { whiteList } = this.state;
            colorDanmuWindow.webContents.send('home-post', { whiteList })
        })
        colorDanmuWindow.on('ready-to-show', () => {
            colorDanmuWindow.show();
        });
        colorDanmuWindow.on('close', () => {
            this.setState({ colorDanmuSwitch: false });
        });
    }

    // 彩色弹幕（输入）
    whiteListInputChange(e) {
        this.setState({ whiteListInput: e.target.value });
    }

    // 彩色弹幕（白名单增减）
    whiteListHandle(type) {
        // 校验彩色弹幕是否为开启状态
        if (this.state.colorDanmuSwitch) {
            Dialog({
                content: '操作白名单前，<br/>请先关闭“彩色弹幕”',
                confirmBtnText: '立即关闭',
                confirmHandle: () => {
                    this.colorDanmuSwitchChange(false);
                },
                hideCancelBtn: false
            });
            return;
        }
        // 校验输入是否为空
        if (!this.state.whiteListInput) {
            Toast('warning', '请输入粉丝昵称')
            return;
        }

        // 存储数据库
        const updateMysql = async whiteList => {
            const param = {
                token: store.get('token'),
                type: 'update',
                list: whiteList.join('，')
            }
            await net.whiteListOperate(param);
        }

        // 修改白名单
        if (type == 'add') {
            if (this.state.whiteList.includes(this.state.whiteListInput)) {
                Toast('warning', '昵称已存在！');
                return;
            }
            let arr = [... this.state.whiteList, this.state.whiteListInput];
            this.setState({
                whiteList: arr,
                whiteListInput: ''
            })
            Toast('success', '添加成功')
            updateMysql(arr);
        }
        if (type == 'remove') {
            if (!this.state.whiteList.includes(this.state.whiteListInput)) {
                Toast('warning', '未找到该昵称！');
                return;
            }
            const resWhiteList = this.state.whiteList.filter(val => {
                return val != this.state.whiteListInput;
            })
            this.setState({
                whiteList: resWhiteList,
                whiteListInput: ''
            })
            Toast('success', '移除成功');
            updateMysql(resWhiteList);
        }
    }

    // 会员支付（打开该模块）
    openPayModule() {
        this.setState({ activeMenuName: '会员支付' })
    }

    // 会员支付（会员配置信息初始化）
    async getVipConfig() {
        const res = await net.getVipConfig();
        if (res.code == 0) {
            this.setState({
                vipConfig: res.data
            })
        } else {
            Toast('warning', '会员配置信息获取失败')

        }
    }

    // 会员支付（menu切换）
    vipMenuChange(menuName) {
        if (menuName == '神秘会员') {
            Toast('warning', '暂未开放，敬请期待', '', false)
        }
    }

    // 会员支付（选择要支付的会员类型）
    vipSelect(index) {
        this.setState({
            vipSeleted: index
        })
    }

    // 会员支付（确认支付成功modal的显隐）
    payModalNeedToKnow(status) {
        this.setState({ payModalNeedToKnow: status })
    }

    // 会员支付（新人免费获取3天会员）
    async getNewerWelfare() {
        const param = {
            token: store.get('token')
        }
        const res = await net.getNewerWelfare(param);
        if (res.code == 0) {
            Toast('success', '领取成功')
            this.setState({
                isVip: 1,
                newerWelfare: 1,
                vipEndTime: new Date(Date.now() + 259200000).toLocaleDateString().replace(/\//g, '-')
            })
        } else {
            Toast('warning', res.msg)
        }
    }

    // 会员支付（点击头像提示）
    vipEndTimeTips() {
        if (this.state.isVip && this.state.vipEndTime) {
            Toast('warning', `您的会员将于 ${this.state.vipEndTime} 到期`, '', false);
        } else {
            Toast('warning', `充值会员，享受更多功能~`, '', false);
        }
    }

    render() {
        let previewBackground = { background: `rgba(0, 0, 0, ${this.state.sliderValue / 100})` };
        let width = (this.state.jcItem.positive.length == 0 && this.state.jcItem.negative.length == 0) ? 
            50 : 
            Math.floor(this.jcItem.positive.length / (this.jcItem.positive.length + this.jcItem.negative.length) * 100)
        let proportionLeftWidth = { width: `${width}%` }
        return (
            <div className='home-page'>
                {/* 左半部分 */}
                <div className="home-aside-l">
                    {/* 账户 */}
                    <div className="account">
                        <div className="account-top" onClick={this.vipEndTimeTips.bind(this)}>
                            <img src={this.state.avatar} alt="" className="avatar" />
                            {this.state.isVip ? <img src={vipIcon} alt="" className='vip' /> : null}
                        </div>
                        <div className="account-btm">
                            <span className="username">{this.state.name ? this.state.name : '用户名'}</span>
                        </div>
                    </div>
                    {/* 菜单 */}
                    <div className="menu">
                        {this.state.menuConfig.map((val1, index1) => {
                            return (
                                <dl className="menu-1-wrapper" key={index1}>
                                    <dt>{val1.categoryName}</dt>
                                    <dd className="menu-2-wrapper">
                                        {val1.list.map((val2, index2) => {
                                            return (
                                                <li key={index2} className={val2.active ? 'active' : ''} onClick={this.menuClick.bind(this, index1, index2)}>
                                                    <img src={val2.active ? val2.icon2 : val2.icon1} alt="" />
                                                    <span>{val2.name}</span>
                                                </li>
                                            )
                                        })}
                                    </dd>
                                </dl>
                            )
                        })}
                    </div>
                </div>
                {/* 右半部分 */}
                <div className="home-aside-r">
                    {/* 可拖拽区域 */}
                    <div className="drag-region-wrapper">
                        <div className="drag-region"></div>
                        <div className="app-btn-wrapper">
                            <div className="minimize" onClick={this.appBtnClick.bind(this, 'minimize')}></div>
                            {/* <div className="maximize" onClick={this.appBtnClick.bind(this, 'maximize')}></div> */}
                            <div className="close" onClick={this.appBtnClick.bind(this, 'close')}></div>
                        </div>
                    </div>
                    {/* 主要渲染内容 */}
                    <div className="main-render">
                        {/* 1.弹幕显示设置 */}
                        {this.state.activeMenuName == '弹幕显示设置' ?
                            <div className="dmxssz">
                                <div className="main-render-title">弹幕显示设置</div>
                                <div className="part part-1">
                                    <div className="part-title">显示弹幕</div>
                                    <Switch checked={this.state.selfDanmuSwitch} onClick={this.selfDanmuSwitchChange.bind(this)} />
                                </div>
                                <div className="part-2-3-wrapper">
                                    <div className="part part-2">
                                        <div className="part-title">个性化设置</div>
                                        <div className="part-content">
                                            {/* checkbox */}
                                            {this.personalizedSetting.map((val, index) => {
                                                return (
                                                    <div className="ckb-wrapper" key={index}>
                                                        <input type="checkbox" id={val.id} checked={this.state[val.id]} onChange={this.checkboxClick.bind(this, val)} />
                                                        <label htmlFor={val.id}>{val.name}</label>
                                                    </div>
                                                )
                                            })}
                                            {/* 滑动条 */}
                                            <div className="slider-container">
                                                <div className="slider-text">背景透明度：</div>
                                                <div className="slider-wrapper">
                                                    {this.state.sliderShow && <Slider min={0} max={100} defaultValue={this.state.sliderValue} disabled={this.state.selfDanmuSwitch} handle={this.sliderHandle.bind(this)} onChange={this.sliderChange.bind(this)} />}
                                                </div>
                                                <div className="slider-value">{this.state.sliderValue}%</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="part part-3">
                                        <div className="part-title">预览</div>
                                        <div className="part-content preview" style={previewBackground}>
                                            <div className="preview-title">
                                                <div className="live-audience">人气值：7955</div>
                                                <div className="new-fans">本次开播新增粉丝数：60</div>
                                            </div>
                                            <div className="preview-content">
                                                {/* 礼物提醒区 */}
                                                <div className="gift-region">
                                                    <div className="title">礼物提醒区</div>
                                                    <div className="content">
                                                        {this.previewGift.map((val, index) => {
                                                            if (this.state.bxslttx && val.giftName == "辣条") {
                                                                return <div className="item" key={index}>&nbsp;</div>;
                                                            }
                                                            return (
                                                                <div className="item" key={index}>
                                                                    <span className='audience-name'>{val.audienceName}</span>
                                                                    赠送了
																<span className='gift-name'> {val.giftName} </span>
                                                                    x{val.giftNum}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                                {/* 弹幕提醒区 */}
                                                <div className="danmu-region">
                                                    <div className="title">弹幕提醒区</div>
                                                    <div className="content">
                                                        {this.previewDanmu.map((val, index) => {
                                                            // 关注提醒
                                                            if (val.type == "newfans") {
                                                                if (!this.state.gztx) {
                                                                    return null;
                                                                } else {
                                                                    return (
                                                                        <div className="item" key={index}>
                                                                            <span className='audience-name'>{val.audienceName}</span>
                                                                            关注了直播间
																	</div>
                                                                    )
                                                                }
                                                            }
                                                            // 进入提醒
                                                            if (val.type == "comein") {
                                                                if (!this.state.jrtx) {
                                                                    return null;
                                                                } else {
                                                                    return (
                                                                        <div className="item" key={index}>
                                                                            <span className='audience-name'>{val.audienceName}</span>
                                                                            进入了直播间
																	</div>
                                                                    )
                                                                }
                                                            }
                                                            return (
                                                                <div className="item" key={index}>
                                                                    <span className='audience-name'>{val.audienceName}</span>
                                                                    ：{val.info}
                                                                </div>
                                                            )
                                                        })}
                                                        <div className="item">... ...</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div> :
                            (this.state.activeMenuName == '弹幕竞猜' ?
                                <div className="dmjc">
                                    {/* 2.弹幕竞猜 */}
                                    <div className="main-render-title">弹幕竞猜</div>
                                    <div className="part part-1">
                                        <div className="part-title">竞猜题目</div>
                                        <div className="part-content">
                                            <input type="text" className="topic" placeholder="输入竞猜题目" value={this.state.topic} onChange={this.jcInputChange.bind(this, 'topic')} />
                                        </div>
                                    </div>
                                    <div className="part part-2">
                                        <div className="part-title">竞猜选项</div>
                                        <div className="part-content">
                                            <input type="text" className="option positive" placeholder="输入正方答案" value={this.state.optionPositive} onChange={this.jcInputChange.bind(this, 'optionPositive')} />
                                            <input type="text" className="option negative" placeholder="输入反方答案" value={this.state.optionNegative} onChange={this.jcInputChange.bind(this, 'optionNegative')} />
                                        </div>

                                    </div>
                                    <div className="part part-3">
                                        <div className="part-title">弹幕匹配（观众输入对应弹幕才能参与竞猜）</div>
                                        <div className="part-content">
                                            <input type="text" className="danmu-match positive" placeholder="例如：#1" value={this.state.matchPositive} onChange={this.jcInputChange.bind(this, 'matchPositive')} />
                                            <input type="text" className="danmu-match negative" placeholder="例如：#2" value={this.state.matchNegative} onChange={this.jcInputChange.bind(this, 'matchNegative')} />
                                        </div>
                                    </div>
                                    <div className="part part-4">
                                        <div className="part-title">开盘截止时间</div>
                                        <div className="part-content">
                                            <input type="text" className="jc-time" value={this.state.jcTime} onChange={this.jcInputChange.bind(this, 'jcTime')} />
                                            <span>分钟后观众不可参与竞猜</span>
                                        </div>
                                    </div>
                                    <div className="btn-wrapper">
                                        <div className="jc-main-btn" onClick={this.jcSaveStart.bind(this)}>{this.state.jcMainBtnStatus == 0 ? '开启竞猜' : '结束竞猜'}</div>
                                    </div>
                                    {this.state.jcModal ?
                                        <div className="jc-modal-wrapper">
                                            <div className="jc-modal">
                                                <div className="topic">{this.state.topic}</div>
                                                <div className="option-res">
                                                    <div className="num">
                                                        <span className="left">{this.state.jcItem.positive.length}人选择了</span>
                                                        <span className="right">{this.state.jcItem.negative.length}人选择了</span>
                                                    </div>
                                                    <div className="proportion">
                                                        <div className="left" style={proportionLeftWidth}>{this.state.optionPositive}</div>
                                                        <div className="right">{this.state.optionNegative}</div>
                                                    </div>
                                                </div>
                                                <div className="text">请选择最终结果</div>
                                                <div className="radio-wrapper">
                                                    <div className={this.state.jcChooseResStatus == 1 ? 'left active' : "left"} onClick={this.chooseJcRes.bind(this, 1)}>
                                                        <div className="circle">
                                                            <div></div>
                                                        </div>
                                                        <div className='left-text'>{this.state.optionPositive}</div>
                                                    </div>
                                                    <div className={this.state.jcChooseResStatus == 2 ? 'right active' : "right"} onClick={this.chooseJcRes.bind(this, 2)}>
                                                        <div className="circle">
                                                            <div></div>
                                                        </div>
                                                        <div className='right-text'>{this.state.optionNegative}</div>
                                                    </div>
                                                </div>

                                                <div className="btn-wrapper">
                                                    <div className="confirm" onClick={this.jcModalConfirm.bind(this)}>确定</div>
                                                    <div className="cancel" onClick={this.jcModalCancel.bind(this)}>取消</div>
                                                </div>

                                            </div>
                                        </div> :
                                        null
                                    }
                                </div> :
                                (this.state.activeMenuName == '彩色弹幕' ?
                                    <div className="csdm">
                                        {/* 3.弹幕竞猜 */}
                                        <div className="main-render-title">彩色弹幕</div>
                                        <div className="part part-1">
                                            <div className="part-title">开启</div>
                                            <Switch checked={this.state.colorDanmuSwitch} onClick={this.colorDanmuSwitchChange.bind(this)} />
                                        </div>
                                        <div className="part part-2">
                                            <div className="part-title">白名单设置</div>
                                            <div className="part-content">
                                                <div className="operate-wrapper">
                                                    <input type="text" placeholder="输入粉丝昵称" disabled={this.state.colorDanmuSwitch} value={this.state.whiteListInput} onChange={this.whiteListInputChange.bind(this)} />
                                                    <div className="btn-wrapper">
                                                        <div className="btn-add" onClick={this.whiteListHandle.bind(this, 'add')}>添加</div>
                                                        <div className="btn-remove" onClick={this.whiteListHandle.bind(this, 'remove')}>移除</div>
                                                    </div>
                                                </div>
                                                <div className="white-list-wrapper">
                                                    <div className="white-list-title">白名单展示：</div>
                                                    <div className="white-list-content">
                                                        {this.state.whiteList.map((val, index) => {
                                                            return <span key={index}>{val}</span>
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div> :
                                    (this.state.activeMenuName == '会员支付' ?
                                        <div className="hyzf">
                                            {/* 会员支付 */}
                                            <div className="main-render-title">我要氪金</div>
                                            <div className="main-render-content">
                                                <div className="menu">
                                                    <div className="menu-item active" onClick={this.vipMenuChange.bind(this, '普通会员')}><span>普通会员</span></div>
                                                    <div className="menu-item" onClick={this.vipMenuChange.bind(this, '神秘会员')}><span>神秘会员</span></div>
                                                </div>
                                                <div className="render">
                                                    <div className="vip-wrapper">
                                                        {this.state.vipConfig.length > 0 && this.state.vipConfig.map((val, index) => {
                                                            return (
                                                                <div className={this.state.vipSeleted == index ? 'vip active' : 'vip'} key={index} onClick={this.vipSelect.bind(this, index)}>
                                                                    {val.vip_red_dot ? <div className="corner">{val.vip_red_dot}</div> : null}
                                                                    <div className="total-time">{val.vip_month}个月</div>
                                                                    <div className="now-money">￥{val.vip_now_money}</div>
                                                                    <div className="old-money">原价：<span>￥{val.vip_origin_money}</span></div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                    <div className="qrcode-container">
                                                        <div className="text">扫码支付</div>
                                                        {this.state.vipConfig.length > 0 &&
                                                            <div className="qrcode-wrapper">
                                                                <div className="qrcode qrcode1">
                                                                    <span>支付宝</span>
                                                                    <img src={this.state.vipConfig[this.state.vipSeleted].vip_ali_pay} alt="" />
                                                                </div>
                                                                <div className="qrcode qrcode2">
                                                                    <span>微信</span>
                                                                    <img src={this.state.vipConfig[this.state.vipSeleted].vip_wx_pay} alt="" />
                                                                </div>
                                                            </div>
                                                        }
                                                    </div>
                                                    <div className="text-tips">请任意选择以上任一方式进行支付，扫码支付时请在支付备注中标明<strong>注册时填写的房间号</strong>，否则无法正常使用。支付后会有一定时间延迟操作，建议在9:00~22:00之间进行充值。</div>
                                                    <div className="btn-wrapper">
                                                        <div className="btn cancel" onClick={this.menuClick.bind(this, 0, 0)}>取消支付</div>
                                                        <div className="btn confirm" onClick={this.payModalNeedToKnow.bind(this, true)}>确认支付成功</div>
                                                    </div>
                                                </div>
                                            </div>
                                            {this.state.payModalNeedToKnow ?
                                                <div className="pay-modal-wrapper">
                                                    <div className="pay-modal need-to-know">
                                                        <div className="title">告知</div>
                                                        <div className="content">
                                                            <div>目前充值后为人工操作变更为会员，所以会有一定的延迟。如您等候时间过久，您可以添加QQ客服：<strong>1609290412</strong>进行催工。也建议您扫描以下二维码加氪金用户反馈QQ群。</div>
                                                            <img src={qqQrcode} alt="" />
                                                        </div>
                                                        <div className="btn-wrapper">
                                                            <div className="btn iknow" onClick={this.payModalNeedToKnow.bind(this, false)}>我知道了</div>
                                                        </div>
                                                    </div>
                                                </div> :
                                                null
                                            }
                                        </div> :
                                        null
                                    )
                                )
                            )
                        }

                        {!this.state.isVip ?
                            (!this.state.newerWelfare ?
                                <div className="pay-modal-wrapper">
                                    <div className="pay-modal new-user-welfare">
                                        <div className="title">新人福利</div>
                                        <div className="content">😁新用户注册成功送体验会员3天！</div>
                                        <div className="btn-wrapper">
                                            <div className="btn receive" onClick={this.getNewerWelfare.bind(this)}>立即领取</div>
                                        </div>
                                    </div>
                                </div> :
                                ((this.state.activeMenuName == '弹幕竞猜' || this.state.activeMenuName == '彩色弹幕') ?
                                    <div className="pay-modal-wrapper">
                                        <div className="pay-modal notice">
                                            <div className="title">通知</div>
                                            <div className="content">
                                                <div>您的会员已过期，如果您认可我们的产品和服务，请付费支持我们！（要恰饭的嘛~。~）</div>
                                                <div className='gongyi'>注：本软件所有收入中的5%会捐出给@免费午餐项目，相关流水会在用户群或B站开发者动态公示。</div>
                                            </div>
                                            <div className="btn-wrapper">
                                                <div className="btn cancel" onClick={this.menuClick.bind(this, 0, 0)}>容我想想</div>
                                                <div className="btn confirm" onClick={this.openPayModule.bind(this)}>点击氪金支持</div>
                                            </div>
                                        </div>
                                    </div> :
                                    null
                                )
                            ) :
                            null
                        }
                    </div>
                </div>
                {/* 更新模态框 */}
                {this.state.showUpdataModal ?
                    <div className="update-container">
                        <div className="update-wrapper">
                            <div className="update-title">发现新版本</div>
                            <div className="update-content">
                                {this.state.updateContent && this.state.updateContent.map((val, index) => {
                                    return <div key={index}>{val}</div>
                                })}
                            </div>
                            <div className="update-btn" onClick={this.quitAndInstall.bind(this)}>重启更新</div>
                        </div>
                    </div> :
                    null
                }
            </div>
        );
    }
}
