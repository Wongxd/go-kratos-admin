import {zhCN, type ZhCNResources} from './zh-CN';
import {enUS, type EnUSResources} from './en-US';

// 资源映射（供 i18next 初始化）
export const resources = {
    'zh-CN': {
        common: zhCN.common,
        auth: zhCN.auth,
        menu: zhCN.menu,
    },
    'en-US': {
        common: enUS.common,
        auth: enUS.auth,
        menu: enUS.menu,
    },
} as const;

// 支持的语言
export const supportedLocales = ['zh-CN', 'en-US'] as const;
export type SupportedLocale = typeof supportedLocales[number];

// 核心资源类型联合（用于 t() 类型推导）
export type CoreResources = ZhCNResources | EnUSResources;
export type CoreNamespace = keyof CoreResources;
export type CoreKey<N extends CoreNamespace> = keyof CoreResources[N];

// 类型安全 t() 函数（仅核心命名空间）
export type CoreTFunction = <N extends CoreNamespace>(
    namespace: N,
    key: CoreKey<N>,
    params?: Record<string, any>
) => string;

// 扩展模块加载器类型
export type ModuleLoader = (lang: string, namespace: string) => Promise<Record<string, any> | null>;
