import common from './common.json';
import auth from './auth.json';
import menu from './menu.json';

export const enUSCore = {
    common,
    auth,
    menu,
} as const;

// 类型导出（用于 t() 智能提示）
export type EnUSCore = typeof enUSCore;
export type EnUSCoreKeys<N extends keyof EnUSCore> = keyof EnUSCore[N];
