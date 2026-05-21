import common from './common.json';
import auth from './auth.json';
import menu from './menu.json';

export const zhCNCore = {
    common,
    auth,
    menu,
} as const;

// 类型导出（用于 t() 智能提示）
export type ZhCNCore = typeof zhCNCore;
export type ZhCNCoreKeys<N extends keyof ZhCNCore> = keyof ZhCNCore[N];
