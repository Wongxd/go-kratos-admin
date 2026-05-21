import React, {useEffect, useMemo, useState} from 'react';

import {ConfigProvider, Watermark, theme as antdTheme, type ThemeConfig} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
// import jaJP from 'antd/locale/ja_JP';

import {usePreferencesStore} from '../../store';
import type {SupportedLanguagesType} from '../../types';

export interface ThemeProviderProps {
    children: React.ReactNode;
}

const localeMap: Record<SupportedLanguagesType, any> = {
    'zh-CN': zhCN,
    'en-US': enUS,
};

/**
 * 全局主题提供者
 * 负责：AntD 主题动态切换、系统深色模式同步、CSS 滤镜、水印、国际化
 */
export const ThemeProvider = ({children}: ThemeProviderProps) => {
    // 1. 精确订阅偏好设置（分别订阅 theme 和 app 模块）
    const themePrefs = usePreferencesStore((state) => state.preferences.theme);
    const appPrefs = usePreferencesStore((state) => state.preferences.app);

    // 2. 系统主题监听（仅当 mode === 'auto' 时生效）
    const [systemIsDark, setSystemIsDark] = useState(false);
    useEffect(() => {
        if (themePrefs.mode !== 'auto') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setSystemIsDark(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [themePrefs.mode]);

    // 计算最终生效的主题模式
    const effectiveMode = useMemo(() => {
        return themePrefs.mode === 'auto' ? (systemIsDark ? 'dark' : 'light') : themePrefs.mode;
    }, [themePrefs.mode, systemIsDark]);

    // 3. 生成 Ant Design 主题配置
    const themeConfig = useMemo((): ThemeConfig => {
        const algorithms = [];
        if (effectiveMode === 'dark') algorithms.push(antdTheme.darkAlgorithm);
        if (appPrefs.compact) algorithms.push(antdTheme.compactAlgorithm);

        return {
            algorithm: algorithms.length > 0 ? algorithms : antdTheme.defaultAlgorithm,
            token: {
                colorPrimary: themePrefs.colorPrimary,
                colorSuccess: themePrefs.colorSuccess,
                colorWarning: themePrefs.colorWarning,
                colorError: themePrefs.colorDestructive,
                borderRadius: Number.parseInt(themePrefs.radius) || 6,
            },
            cssVar: {key: 'theme'}, // AntD 推荐：启用 CSS 变量，提升动态主题渲染性能
        };
    }, [effectiveMode, appPrefs.compact, themePrefs]);

    // 4. 应用 CSS 滤镜（色弱 / 灰色模式）
    useEffect(() => {
        const root = document.documentElement;
        if (appPrefs.colorWeakMode) {
            root.style.filter = 'invert(80%)';
        } else if (appPrefs.colorGrayMode) {
            root.style.filter = 'grayscale(100%)';
        } else {
            root.style.filter = '';
        }
    }, [appPrefs.colorWeakMode, appPrefs.colorGrayMode]);

    // 5. 国际化配置
    const locale = localeMap[appPrefs.locale] ?? zhCN;

    // 6. 水印内容
    const watermarkText = appPrefs.watermark ? `${appPrefs.name} ${appPrefs.version}` : '';

    return (
        <ConfigProvider
            theme={themeConfig}
            locale={locale}
            wave={{disabled: true}} // 关闭点击波纹，提升 Admin 操作手感
        >
            {watermarkText ? (
                <Watermark
                    content={watermarkText}
                    font={{fontSize: 14, color: 'rgba(0, 0, 0, 0.15)'}}
                    gap={[120, 120]}
                    offset={[60, 60]}
                    rotate={-22}
                    zIndex={1}
                >
                    {children}
                </Watermark>
            ) : (
                children
            )}
        </ConfigProvider>
    );
};
