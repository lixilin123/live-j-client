// 图片
import zbjsz from '../img/menu-icon/zbjsz.png'
import zbjszActive from '../img/menu-icon/zbjsz-active.png'
// import yybb from '../img/menu-icon/yybb.png'
// import yybbActive from '../img/menu-icon/yybb-active.png'
// import dgt from '../img/menu-icon/dgt.png'
// import dgtActive from '../img/menu-icon/dgt-active.png'
// import dmcj from '../img/menu-icon/dmcj.png'
// import dmcjActive from '../img/menu-icon/dmcj-active.png'
import dmjc from '../img/menu-icon/dmjc.png'
import dmjcActive from '../img/menu-icon/dmjc-active.png'
// import gzjfph from '../img/menu-icon/gzjfph.png'
// import gzjfphActive from '../img/menu-icon/gzjfph-active.png'
import csdm from '../img/menu-icon/csdm.png'
import csdmActive from '../img/menu-icon/csdm-active.png'
// import lwcj from '../img/menu-icon/lwcj.png'
// import lwcjActive from '../img/menu-icon/lwcj-active.png'
// import dmtj from '../img/menu-icon/dmtj.png'
// import dmtjActive from '../img/menu-icon/dmtj-active.png'
// import sjfx from '../img/menu-icon/sjfx.png'
// import sjfxActive from '../img/menu-icon/sjfx-active.png'

export default {
    menuConfig: [
        {
            categoryName: '基础功能',
            list: [
                { name: '弹幕显示设置', active: true, icon1: zbjsz, icon2: zbjszActive }
                // { name: '语音播报', active: false, icon1: yybb, icon2: yybbActive },
                // { name: '点歌台', active: false, icon1: dgt, icon2: dgtActive },
                // { name: '弹幕抽奖', active: false, icon1: dmcj, icon2: dmcjActive }
            ]
        },
        {
            categoryName: '推荐玩法',
            list: [
                { name: '弹幕竞猜', active: false, icon1: dmjc, icon2: dmjcActive },
                // { name: '观众积分排行', active: false, icon1: gzjfph, icon2: gzjfphActive },
                { name: '彩色弹幕', active: false, icon1: csdm, icon2: csdmActive }
                // { name: '礼物抽奖', active: false, icon1: lwcj, icon2: lwcjActive }
            ]
        }
        // {
        //   categoryName: '直播统计',
        //   list: [
        //     { name: '弹幕统计', active: false, icon1: dmtj, icon2: dmtjActive },
        //     { name: '数据分析', active: false, icon1: sjfx, icon2: sjfxActive }
        //   ]
        // }
    ],
    personalizedSetting: [
        {id:'gztx', name: '关注提醒'},
        {id:'jrtx', name: '进入提醒'},
        {id:'bxslttx', name: '不显示辣条提醒'},
        {id:'pbxdsdm', name: '屏蔽小电视弹幕'},
    ],
    previewGift: [
        {audienceName: '匿名用户1', giftName: '舰长', giftNum: '1'},
        {audienceName: '匿名用户2', giftName: '么么哒', giftNum: '10'},
        {audienceName: '匿名用户3', giftName: '比心', giftNum: '36'},
        {audienceName: '匿名用户4', giftName: '辣条', giftNum: '666'}
    ],
    previewDanmu: [
        {audienceName: '匿名用户5', type: 'newfans'},
        {audienceName: '匿名用户6', type: 'comein'},
        {audienceName: '匿名用户7', type: 'info', info: '主播这波秀啊！'},
        {audienceName: '匿名用户8', type: 'info', info: '我靠！牛批牛批~'},
        {audienceName: '匿名用户9', type: 'info', info: '我感觉如果交闪现，还可以杀更多！'},
        {audienceName: '匿名用户10', type: 'info', info: '祖传闪现，不可能交的，哈哈!'}
    ]
}