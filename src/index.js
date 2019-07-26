import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import './index.scss';
import App from './router/index';

ReactDOM.render(
    <HashRouter>
        <App/> 
    </HashRouter>
    , document.getElementById('root')
);
