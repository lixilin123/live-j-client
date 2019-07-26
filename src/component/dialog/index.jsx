// 基础引入
import React from 'react'
import ReactDOM from 'react-dom';
import './index.scss'

class DialogComponent extends React.Component {
    // 关闭dialog
    closeDialog() {
        const dialogArr = document.querySelectorAll('.dialog');
        dialogArr.forEach((dialog) => {
            ReactDOM.unmountComponentAtNode(dialog);
            document.body.removeChild(dialog);
        })
    }

    // 确认
    confirmClick() {
        this.closeDialog();
        this.props.options.confirmHandle();
    }

    // 取消
    cancelClick() {
        this.closeDialog();
        this.props.options.cancelHandle();
    }

    render() {
        let options = this.props.options;
        return (
            <div className='dialog-container'>
                <div className="dialog-wrapper">
                    <div className='dialog-title'>提示</div>
                    <div className='dialog-content'>
                        <span dangerouslySetInnerHTML={{ __html: options.content }}></span>
                    </div>
                    <div className='dialog-btn-wrapper'>
                        {options.hideCancelBtn ? null : <div onClick={this.cancelClick.bind(this)}>{options.cancelBtnText}</div>}
                        <div onClick={this.confirmClick.bind(this)}>{options.confirmBtnText}</div>
                    </div>
                </div>
            </div>
        )
    }
}

/**
 * 方法描述：触发modal
 * @param content {String} 内容
 * @param confirmBtnText {String} 确定按钮文案
 * @param cancelBtnText {String} 取消按钮文案
 * @param confirmHandle {Function} 点击确认按钮触发的回调
 * @param cancelHandle {Function} 点击取消按钮触发的回调
 * @param hideCancelBtn {Boolean} 取消按钮是否显示
 */
const Dialog = (options) => {
    const div = document.createElement('div');
    div.classList.add('dialog');
    ReactDOM.render((
        <DialogComponent options={Object.assign({
            confirmBtnText: '确定',
            cancelBtnText: '取消',
            confirmHandle: () => {},
            cancelHandle: () => {},
            hideCancelBtn: true
        }, options)} />
    ), div);
    document.body.appendChild(div);
}

export default Dialog;
