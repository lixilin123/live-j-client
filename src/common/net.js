/**
 * 描述：该文件封装了所有渲染进程要调用的API
 */

// 引库
import qs from 'querystring';

// 定义常量
const DEBUG = false,
    HOST = DEBUG ? 'http://10.10.28.162:3001' : 'http://yishisi.cn:8321';

// 封装fetch，方便调用
let ajax = (host, path, param = {}, options = {}) => {
    let url = host + path;
    if (options.method == 'GET') {
        url += `?${qs.stringify(param)}`;
    } else {
        options.body = JSON.stringify(param);
    }
    return fetch(url, Object.assign({}, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-type': 'application/json' }
    }, options))
        .then(str => str.json());
}

// 导出各个API
let net = {
    // 注册
    signUp(param) {
        return ajax(HOST, '/account/signUp', param)
    },
    // 登录
    signIn(param) {
        return ajax(HOST, '/account/signIn', param)
    },
    // 校验token
    checkToken(param) {
        return ajax(HOST, '/account/checkToken', param)
    },
    // 获取重置密码的url
    createResetPasswordUrl(param) {
        return ajax(HOST, '/account/createResetPasswordUrl', param)
    },
    // 获取更新内容
    getUpdateContent(param) {
        return ajax(HOST, '/update/content', param)
    },
    // home页初始化数据
    init(param) {
        return ajax(HOST, '/home/init', param)
    },
    // 彩色弹幕白名单增减
    whiteListOperate(param) {
        return ajax(HOST, '/home/whiteListOperate', param)
    },
    // 获取会员配置信息
    getVipConfig(param) {
        return ajax(HOST, '/home/vipConfig', param)
    },
    // 新人免费获取3天会员
    getNewerWelfare(param) {
        return ajax(HOST, '/home/getNewerWelfare', param)
    }
}

export default net;