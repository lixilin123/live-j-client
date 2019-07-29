import {observable, autorun} from 'mobx';

// 全局状态容器
const state = observable({
    danmuPool: {
        gift: [],
        danmu: []
    },
});

autorun(() => {
    if (state.danmuPool.gift.length > 40) state.danmuPool.gift.shift();
    if (state.danmuPool.danmu.length > 40) state.danmuPool.danmu.shift();
})


export default state;