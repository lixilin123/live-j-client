import React from 'react';
import { remote, ipcRenderer } from 'electron';
import nodemailer from 'nodemailer';
import Store from '../../store/store.js';
import net from '../../common/net.js';
import Loading from '../../component/loading/index.jsx';
import Dialog from '../../component/dialog/index';
import './index.scss'
const store = new Store({
    configName: 'userData',
    defaults: {}
});
export default class Account extends React.Component {
    constructor() {
        super();
        this.state = {
            loading: true,
            // 页面状态：0,是否登录check-token（默认） 1.注册sign-up, 2.登录sign-in, 3.重置密码reset-password
            pageStatus: 'sign-in',
            // 用户信息
            username: { value: '', checkInfo: '', placeholder: '昵称' },
            roomid: { value: '', checkInfo: '', placeholder: '房间ID' },
            email: { value: '', checkInfo: '', placeholder: '邮箱' },
            password: { value: '', checkInfo: '', placeholder: '密码' },
            confirmpassword: { value: '', checkInfo: '', placeholder: '确认密码' }
        }
    }

    componentDidMount() {
        document.title = '直播酱登录注册';
        Loading(true, '加载中', 1);
        this.checkLogin();
    }

    // 创建主窗口
    createHomeWindow() {
        ipcRenderer.sendSync('createWindow', {
            windowName: 'home',
            initConfig: {
                width: 940,
                height: 600,
                show: false,
                frame: false,
                transparent: true,
                resizable: false,
                webPreferences: {
                    nodeIntegration: true
                }
            }
        })
        const windowId = ipcRenderer.sendSync('getWindow', { windowName: 'home' })
        let homeDanmuWindow = remote.BrowserWindow.fromId(windowId);
        homeDanmuWindow.on('ready-to-show', () => {
            homeDanmuWindow.show();
            ipcRenderer.send('closeWindow', 'account');
        });



    };

    // 检验是否登录
    async checkLogin() {
        const token = store.get('token');
        if (!token) {
            // 1.压根没登陆过
            Loading(false)
        } else {
            const res = await net.checkToken({ token });
            if (res.code == 0) {
                // 2.token可用
                this.createHomeWindow();
            } else {
                // 3.token失效或被篡改
                Loading(false);
                Dialog({ content: `${res.msg}` })
            }
        }
    }

    // 修改页面状态
    changePageStatus(status) {
        this.setState({
            pageStatus: status,
            username: { value: '', checkInfo: '', placeholder: '昵称' },
            roomid: { value: '', checkInfo: status == 'sign-up' ? '注册后不可更改' : '', placeholder: '房间ID' },
            email: { value: '', checkInfo: '', placeholder: '邮箱' },
            password: { value: '', checkInfo: '', placeholder: '密码' },
            confirmpassword: { value: '', checkInfo: '', placeholder: '确认密码' }
        });

        const accountWindow = remote.getCurrentWindow();
        if (status == 'sign-up') {
            accountWindow.setSize(340, 730);
        }
        if (status == 'sign-in') {
            accountWindow.setSize(340, 530);
        }
        if (status == 'reset-password') {
            accountWindow.setSize(340, 460);
        }
        accountWindow.center();
    }

    // 输入框聚焦，提示输入的格式，并清除错误提示
    inputFocus(type) {
        let _this = this;
        let placeholder = this.state[type].placeholder;
        switch (type) {
            case 'password' || 'confirmpassword':
                if (this.state.pageStatus == 'sign-up') { placeholder = '下划线、字母、数字，8~14个字符' };
                break;
            case 'username': placeholder = '支持汉字，字母，数字'; break;
        }
        this.setState({ [type]: Object.assign(_this.state[type], { checkInfoCode: 0, placeholder: placeholder }) });
    }

    // 输入框失焦，恢复默认的placeholder
    inputBlur(type) {
        let _this = this;
        let placeholder = this.state[type].placeholder;
        switch (type) {
            case 'password': placeholder = '密码'; break;
            case 'confirmpassword': placeholder = '确认密码'; break;
            case 'username': placeholder = '昵称'; break;
        }
        this.setState({ [type]: Object.assign(_this.state[type], { placeholder: placeholder }) });
    }

    // 监听输入，进行存储
    inputChange(type, e) {
        let _this = this;
        this.setState({ [type]: Object.assign(_this.state[type], { value: e.target.value }) })
    }

    // 校验输入信息格式是否正确
    checkInput() {
        let _this = this;
        return new Promise((resolve, reject) => {
            let canSubmit = true;
            // 封装处理函数
            let handle = (type) => {
                let checkInfo = '';
                if (type == 'roomid') {
                    if (!_this.state[type].value) {
                        checkInfo = '房间ID不能为空！';
                        canSubmit = false;
                    } else if (!/^\d+$/.test(_this.state[type].value)) {
                        checkInfo = '房间ID格式错误！';
                        canSubmit = false;
                    }
                    this.setState({ [type]: Object.assign(_this.state[type], { checkInfo }) })
                    return;
                }

                if (type == 'password') {
                    if (!_this.state[type].value) {
                        checkInfo = '密码不能为空！';
                        canSubmit = false;
                    } else if (!/^\w{8,14}$/.test(_this.state[type].value)) {
                        checkInfo = '密码格式错误！';
                        canSubmit = false;
                    }
                    this.setState({ [type]: Object.assign(_this.state[type], { checkInfo }) })
                    return;
                }

                if (type == 'confirmpassword') {
                    if (!_this.state[type].value) {
                        checkInfo = '确认密码不能为空！';
                        canSubmit = false;
                    } else if (_this.state[type].value != _this.state['password'].value) {
                        checkInfo = '确认密码与密码不一致！';
                        canSubmit = false;
                    }
                    this.setState({ [type]: Object.assign(_this.state[type], { checkInfo }) })
                    return;
                }

                if (type == 'email') {
                    if (!_this.state[type].value) {
                        checkInfo = '邮箱不能为空！';
                        canSubmit = false;
                    } else if (!/@/.test(_this.state[type].value)) {
                        checkInfo = '邮箱格式错误！';
                        canSubmit = false;
                    }
                    this.setState({ [type]: Object.assign(_this.state[type], { checkInfo }) })
                    return;
                }

                if (type == 'username') {
                    if (!_this.state[type].value) {
                        checkInfo = '昵称不能为空！';
                        canSubmit = false;
                    } else if (!/^[A-Za-z0-9\u4e00-\u9fa5]+$/.test(_this.state[type].value)) {
                        checkInfo = '昵称格式错误！';
                        canSubmit = false;
                    }
                    this.setState({ [type]: Object.assign(_this.state[type], { checkInfo }) })
                    return;
                }
            }

            // 定义要处理的数组
            let typeArr = [];
            if (_this.state.pageStatus == 'sign-up') {
                typeArr.push('roomid', 'password', 'confirmpassword', 'email', 'username')
            } else if (_this.state.pageStatus == 'sign-in') {
                typeArr.push('email', 'password')
            } else if (_this.state.pageStatus == 'reset-password') {
                typeArr.push('email')
            }
            // 遍历数组，用处理函数进行处理
            typeArr.forEach(val => void handle(val));

            if (canSubmit) resolve(true);
        })

    }

    // 发送邮件
    async postEmail(url) {
        const transporter = nodemailer.createTransport({
            host: "smtp.qq.com",
            port: 465,
            secure: true,
            auth: {
                user: 'lixilin123@foxmail.com',
                pass: 'pwqhcdkgbjgqdbcg'
            }
        });

        await transporter.sendMail({
            from: '"直播酱管理员👮‍" <lixilin123@foxmail.com>',
            to: this.state.email.value,
            subject: "重置密码",
            html: `点击下面链接进行重置（注意：链接10分钟内有效）<br/><a href='${url}'>${url}</a>`
        });
        Loading(false)
        Dialog({
            content: '重置密码邮件已发送，请查收！'
        })
    }

    // 提交
    async submit() {
        if (await this.checkInput()) {
            console.log('开始提交信息');
            if (this.state.pageStatus == 'sign-up') {
                // 注册
                const param = {
                    username: this.state.username.value,
                    roomid: this.state.roomid.value,
                    email: this.state.email.value,
                    password: this.state.password.value
                }
                Loading(true, '注册中')
                const res = await net.signUp(param);
                Loading(false)
                if (res.code == 0) {
                    Dialog({
                        content: '😀恭喜您，注册成功',
                        confirmBtnText: '去登录',
                        confirmHandle: () => {
                            this.changePageStatus('sign-in')
                        }
                    })
                } else {
                    Dialog({ content: `😥 ${res.msg}` })
                }
            } else if (this.state.pageStatus == 'sign-in') {
                // 登录
                const param = {
                    email: this.state.email.value,
                    password: this.state.password.value
                }
                Loading(true, '登录中')
                const res = await net.signIn(param);
                Loading(false)
                if (res.code == 0) {
                    // 存储token
                    store.set('token', res.data.token)
                    // 登录成功，打开主窗口
                    Loading(true, '登陆中')
                    this.createHomeWindow();
                } else {
                    Dialog({ content: `😥 ${res.msg}` })
                }
            } else if (this.state.pageStatus == 'reset-password') {
                Loading(true, '发送中')
                const res = await net.createResetPasswordUrl({ email: this.state.email.value });
                if (res.code == 0) {
                    this.postEmail(res.data.url)
                } else {
                    Loading(false)
                    Dialog({ content: `😥 ${res.msg}` })
                }
            }
        }
    }

    closeAccountWindow() {
        ipcRenderer.send('closeWindow', 'account');
    }

    render() {
        return (
            <div className="account-page">
                <div className="app-name">bilibili直播酱</div>
                <div className="close-btn" onClick={this.closeAccountWindow.bind(this)}>X</div>

                <div className="main">
                    {/sign-up/.test(this.state.pageStatus) ?
                        <div className="input-wrapper roomid-wrapper">
                            <input
                                type="text"
                                className="roomid"
                                placeholder={this.state.roomid.placeholder}
                                value={this.state.roomid.value}
                                onFocus={this.inputFocus.bind(this, 'roomid')}
                                onBlur={this.inputBlur.bind(this, 'roomid')}
                                onChange={this.inputChange.bind(this, 'roomid')} />
                            <div className="check-info">{this.state.roomid.checkInfo}</div>
                        </div> :
                        null
                    }
                    {/sign-up|sign-in|reset-password/.test(this.state.pageStatus) ?
                        <div className="input-wrapper email-wrapper">
                            <input
                                type="text"
                                className="email"
                                placeholder={this.state.email.placeholder}
                                value={this.state.email.value}
                                onFocus={this.inputFocus.bind(this, 'email')}
                                onBlur={this.inputBlur.bind(this, 'email')}
                                onChange={this.inputChange.bind(this, 'email')} />
                            <div className="check-info">{this.state.email.checkInfo}</div>
                            {/reset-password/.test(this.state.pageStatus) ? <div className="submit" onClick={this.submit.bind(this)}></div> : null}
                        </div> :
                        null
                    }
                    {/sign-up|sign-in/.test(this.state.pageStatus) ?
                        <div className="input-wrapper password-wrapper">
                            <input
                                type="password"
                                className="password"
                                placeholder={this.state.password.placeholder}
                                value={this.state.password.value}
                                onFocus={this.inputFocus.bind(this, 'password')}
                                onBlur={this.inputBlur.bind(this, 'password')}
                                onChange={this.inputChange.bind(this, 'password')} />
                            <div className="check-info">{this.state.password.checkInfo}</div>
                            {/sign-in/.test(this.state.pageStatus) ? <div className="submit" onClick={this.submit.bind(this)}></div> : null}
                        </div> :
                        null
                    }
                    {/sign-up/.test(this.state.pageStatus) ?
                        <div className="input-wrapper confirm-password-wrapper">
                            <input
                                type="password"
                                className="confirm-password"
                                placeholder={this.state.confirmpassword.placeholder}
                                value={this.state.confirmpassword.value}
                                onFocus={this.inputFocus.bind(this, 'confirmpassword')}
                                onBlur={this.inputBlur.bind(this, 'confirmpassword')}
                                onChange={this.inputChange.bind(this, 'confirmpassword')} />
                            <div className="check-info">{this.state.confirmpassword.checkInfo}</div>
                        </div> :
                        null
                    }
                    {/sign-up/.test(this.state.pageStatus) ?
                        <div className="input-wrapper username-wrapper">
                            <input
                                type="text"
                                className="username"
                                placeholder={this.state.username.placeholder}
                                value={this.state.username.value}
                                onFocus={this.inputFocus.bind(this, 'username')}
                                onBlur={this.inputBlur.bind(this, 'username')}
                                onChange={this.inputChange.bind(this, 'username')} />
                            <div className="check-info">{this.state.username.checkInfo}</div>
                            <div className="submit" onClick={this.submit.bind(this)}></div>
                        </div> :
                        null
                    }
                    {/sign-in/.test(this.state.pageStatus) ?
                        <div className="btn-wrapper-1">
                            <div className="to-sign-up" onClick={this.changePageStatus.bind(this, 'sign-up')}>注册账号</div>
                            <div className="to-reset-password" onClick={this.changePageStatus.bind(this, 'reset-password')}>忘记密码?</div>
                        </div> :
                        null
                    }
                    {/sign-up|reset-password/.test(this.state.pageStatus) ?
                        <div className="btn-wrapper-2">
                            <div className="to-sign-in" onClick={this.changePageStatus.bind(this, 'sign-in')}>去登录</div>
                        </div> :
                        null
                    }
                </div>
            </div>
        );
    }
}
