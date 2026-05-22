/**
 * Request Token 配置
 *
 * 用于在应用初始化时设置 token 获取方法
 */

import React, {useEffect, useRef} from 'react';

import {setGetTokenCallback} from './rest-client';
import {useAuthStore} from '@/stores/auth';

/**
 * RequestTokenSetup 组件
 * 在应用初始化时设置 token 获取回调
 */
export function RequestTokenSetup({children}: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    // StrictMode 下 useEffect 会执行两次，确保只初始化一次
    if (initialized.current) return;
    initialized.current = true;

    // 设置获取 Token 的回调函数
    setGetTokenCallback(() => {
      const token = useAuthStore.getState().accessToken;
      console.log('Getting access token:', token ? '***' + token.slice(-8) : 'null');
      return token || null;
    });

    console.log('Request client initialized with access token getter');
  }, []);

  return <>{children}</>;
}
