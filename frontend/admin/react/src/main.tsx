import React from 'react'
import ReactDOM from 'react-dom/client'

import {QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";

import {ThemeProvider} from "@/core/preferences/components/ThemeProvider";

// 样式
import 'uno.css';
import 'nprogress/nprogress.css';
import './styles/global.css';
import '@/assets/css/scrollbar.less';
import '@/assets/css/theme-color.less';
import '@/assets/css/public.less';
import '@/assets/fonts/font.less';
// antd
import '@/assets/css/antd.less';

import {bootstrap, queryClient} from "./core";

import './index.css'
import App from './App.tsx'

// 执行全局初始化
bootstrap().then(() => {
    const root = ReactDOM.createRoot(document.getElementById('root')!)

    root.render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <App/>
                </ThemeProvider>

                <ReactQueryDevtools initialIsOpen={false}/>
            </QueryClientProvider>
        </React.StrictMode>
    );
});
