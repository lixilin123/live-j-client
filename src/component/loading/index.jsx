
// 基础引入
import React from 'react'
import ReactDOM from 'react-dom';
import './index.scss'

class LoadingComponent extends React.Component {
    render() {
        let style = {background: `rgba(51,51,51,${this.props.opacity})`}
        return (
            <div className='loading-container' style={style}>
                <div className="sk-cube-grid">
                    <div className="sk-cube sk-cube1"></div>
                    <div className="sk-cube sk-cube2"></div>
                    <div className="sk-cube sk-cube3"></div>
                    <div className="sk-cube sk-cube4"></div>
                    <div className="sk-cube sk-cube5"></div>
                    <div className="sk-cube sk-cube6"></div>
                    <div className="sk-cube sk-cube7"></div>
                    <div className="sk-cube sk-cube8"></div>
                    <div className="sk-cube sk-cube9"></div>
                </div>
                <span className='loading-text'>{this.props.msg}</span>
            </div>
        )
    }
}

/**
 * 方法描述：触发loading
 * @param show {Boolean} 显示或隐藏
 * @param msg {String} 文案，默认“加载中”
 */
const Loading = (show = true, msg = '加载中', opacity=0.7) => {
    if (show) {
        const div = document.createElement('div');
        div.classList.add('loading-dialog');
        ReactDOM.render((
            <LoadingComponent
                msg={msg}
                opacity={opacity}
            />
        ), div);
        document.body.appendChild(div);
    } else {
        const loading = document.querySelector('.loading-dialog');
        ReactDOM.unmountComponentAtNode(loading);
        document.body.removeChild(loading);
    }
}

export default Loading;