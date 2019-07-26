import React, { Component } from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';
import Loadcomps from './loadcomps';

class App extends Component {
    render() {
        const { location } = this.props;
        return (
            <Switch key={location.pathname} location={location}>
                {/* 账户注册登录页 */}
                <Route exact path="/account" component={Loadcomps(() => import('../page/account/index'))} />
                {/* 首页 */}
                <Route exact path="/home" component={Loadcomps(() => import('../page/home/index'))} />
                {/* 主播自己看的弹幕 */}
                <Route exact path="/selfDanmu" component={Loadcomps(() => import('../page/self-danmu/index'))} />
                {/* 观众看的竞猜弹幕 */}
                <Route exact path="/jcShow" component={Loadcomps(() => import('../page/jc-show/index'))} />
                {/* 观众看的彩色弹幕 */}
                <Route exact path="/colorDanmu" component={Loadcomps(() => import('../page/color-danmu/index'))} />
            </Switch>
        )
    }
}
export default withRouter(App);