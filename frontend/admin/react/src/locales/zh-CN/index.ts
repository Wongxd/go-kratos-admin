import {zhCNCore, type ZhCNCore} from './_core';
import {zhCNModules, parseModulePath, loadModule} from './_modules';

// 合并核心 + 扩展（核心预加载，扩展按需）
export const zhCN = {
    ...zhCNCore,
    // 扩展模块不直接合并，避免首屏打包所有文件
    // 通过 loadModule() 按需加载
};

// 类型导出（核心完美类型 + 扩展宽松类型）
export type ZhCNResources = ZhCNCore & {
    // 扩展模块：运行时加载，类型宽松
    [key: string]: Record<string, any>;
};

// 导出加载器
export {loadModule, parseModulePath};

// 获取所有可用扩展模块列表（用于调试/预加载）
export const getAvailableModules = async (): Promise<string[]> => {
    const modules: string[] = [];
    for (const path of Object.keys(zhCNModules)) {
        const ns = parseModulePath(path);
        if (ns) modules.push(ns);
    }
    return modules;
};
