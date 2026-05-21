import type {ProLayoutProps} from '@ant-design/pro-components';
import type {AppRouteObject} from '@/core/router/types';

type MenuRoute = AppRouteObject;

export const transformRoutesToMenu = (
    routes: MenuRoute[],
    permissions: string[]
): NonNullable<ProLayoutProps['route']>['routes'] => {
    return routes
        .filter((route) => {
            // 过滤掉隐藏菜单或没有权限的路由
            if (route.meta?.hideInMenu) return false;

            const meta = route.meta;
            // 如果有权限要求且用户不在权限列表中，则过滤
            return !(meta?.permission && !permissions.includes(meta.permission));
        })
        .map((route) => {
            const menuItem: any = {
                path: route.path,
                name: route.label || route.meta?.title,
                icon: route.meta?.icon,
            };

            if (route.children) {
                menuItem.children = transformRoutesToMenu(route.children, permissions);
            }

            return menuItem;
        })
        .filter(Boolean);
};
