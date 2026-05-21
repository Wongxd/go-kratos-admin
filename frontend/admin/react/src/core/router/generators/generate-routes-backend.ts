import {type ComponentType, createElement, Suspense} from 'react';

import {mapTree} from '@/utils';
import Loading from '@/components/common/Loading';
import type {AppRouteObject, BackendRoute, ComponentRecord, GenerateRoutesOptions} from "@/core/router/types"; // 全局加载组件

/**
 * 动态生成路由 - 后端方式（React 版本）
 * @param options - 配置选项
 * @returns 转换后的路由树（AppRouteObject[]），可直接传入 createBrowserRouter
 */
export async function generateRoutesByBackend(
    options: GenerateRoutesOptions
): Promise<AppRouteObject[]> {
    const {fetchMenuListAsync, layoutMap = {}, pageMap = {}} = options;

    try {
        // 1. 从后端获取菜单路由（组件路径为字符串）
        const menuRoutes = await fetchMenuListAsync?.();
        if (!menuRoutes?.length) {
            return [];
        }

        // 2. 预处理 pageMap：标准化路径键名（支持多种写法）
        const normalizedPageMap: ComponentRecord = {};
        for (const [key, value] of Object.entries(pageMap)) {
            const normalizedKey = normalizeViewPath(key);
            normalizedPageMap[normalizedKey] = value;
            // 兼容：如果传入的是带后缀的，也注册不带后缀的映射
            if (normalizedKey.endsWith('.tsx')) {
                normalizedPageMap[normalizedKey.replace(/\.tsx$/, '')] = value;
            }
        }

        // 3. 递归转换路由树
        return convertRoutes(menuRoutes, layoutMap, normalizedPageMap);
    } catch (error) {
        console.error('Failed to generate routes from backend:', error);
        return [];
    }
}

/**
 * 递归转换后端路由为 React 路由
 */
function convertRoutes(
    routes: BackendRoute[],
    layoutMap: ComponentRecord,
    pageMap: ComponentRecord
): AppRouteObject[] {
    return mapTree(routes, (node) => {
        const {component: componentPath, name, children, ...rest} = node;

        if (!name) {
            console.error('Route name is required', node);
        }

        const route: AppRouteObject = {
            ...rest,
            name,
            children: children?.length ? convertRoutes(children, layoutMap, pageMap) : undefined,
        };

        if (componentPath) {
            let Component: ComponentType<any> | undefined;

            // 1. 优先匹配布局组件
            if (layoutMap[componentPath]) {
                Component = layoutMap[componentPath];
            }
            // 2. 匹配页面组件（标准化路径后查找）
            else {
                const normalizedPath = normalizeViewPath(componentPath);
                // 尝试多种后缀组合
                const candidates = [
                    normalizedPath,
                    normalizedPath.endsWith('.tsx') ? normalizedPath : `${normalizedPath}.tsx`,
                    normalizedPath.endsWith('/index') ? normalizedPath : `${normalizedPath}/index`,
                    `${normalizedPath}/index.tsx`,
                ];

                for (const candidate of candidates) {
                    if (pageMap[candidate]) {
                        Component = pageMap[candidate];
                        break;
                    }
                }
            }

            // 3. 渲染元素：必须用 Suspense 包裹 lazy 组件
            if (Component) {
                route.element = createElement(
                    Suspense,
                    {fallback: createElement(Loading)},
                    createElement(Component)
                );
            } else {
                // 开发环境警告，生产环境降级处理
                if (import.meta.env.DEV) {
                    console.warn(`Component not found for path: ${componentPath}`);
                }
                route.element = createElement('div', null, `404 - Component "${componentPath}" not found`);
            }
        }

        return route;
    });
}

/**
 * 标准化视图路径（适配 React 目录结构）
 * @param path - 后端返回的组件路径，如 "./views/system/user" 或 "/views/dashboard"
 */
export function normalizeViewPath(path: string): string {
    // 1. 去除相对路径前缀
    const normalized = path.replace(/^(\.\/|\.\.\/)+/, '');

    // 2. 确保以 / 开头
    const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;

    // 3. 去除目录前缀（适配 React 项目结构）
    // 支持多种常见目录：/views, /pages, /src/pages 等
    return withSlash
        .replace(/^\/(src\/)?(views|pages)\//i, '/')  // 去除 /views/ 或 /pages/
        .replace(/\/+$/, '');                          // 去除末尾斜杠
}
