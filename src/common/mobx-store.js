import {observable} from 'mobx';

// 全局状态容器
const state = observable({
    danmuPool: {
        newFans: 0
    },
});

export default state;