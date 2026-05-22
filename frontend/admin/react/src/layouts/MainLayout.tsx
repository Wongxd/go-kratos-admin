import {Outlet, useNavigate, useLocation} from 'react-router-dom';
import {ProLayout} from '@ant-design/pro-components';
import {ConfigProvider, theme} from 'antd';
import {useMemo} from 'react';

import {useUserStore, useAuthStore} from '@/stores';
import {usePreferences} from '@/core/preferences';
import {staticRoutes} from '@/router/config/static';
import {transformRoutesToMenu} from "@/core/router/utils/menu.ts";

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {userInfo, userRoles} = useUserStore();
    const {logout} = useAuthStore();
    const {sidebar, app, logo, isDark} = usePreferences();

    // 根据偏好设置计算 Ant Design 主题算法
    const algorithm = useMemo(() => {
        return isDark ? theme.darkAlgorithm : theme.defaultAlgorithm;
    }, [isDark]);

    // 转换静态路由为菜单数据
    const menuData = useMemo(() => {
        return transformRoutesToMenu(staticRoutes, userRoles);
    }, [userRoles]);

    return (
        <ConfigProvider
            theme={{
                algorithm,
                token: {
                    colorPrimary: '#1677ff',
                    borderRadius: 6,
                },
            }}
        >
            <ProLayout
                title={app.name}
                logo={logo.enable ? logo.source : false}
                layout="side"
                contentWidth="Fluid"
                fixedHeader={true}
                fixSiderbar={true}
                collapsed={sidebar.collapsed}
                onCollapse={(collapsed) => {
                    // 可以通过 updatePreferences 更新侧边栏状态
                }}
                location={location}
                route={{routes: menuData}}
                menuItemRender={(item, dom) => (
                    <div
                        onClick={() => {
                            if (item.path) navigate(item.path);
                        }}
                    >
                        {dom}
                    </div>
                )}
                avatarProps={{
                    src: userInfo?.avatar || app.defaultAvatar,
                    title: userInfo?.username,
                    size: 'small',
                    render: (_props, dom) => {
                        return (
                            <div onClick={() => logout()}>
                                {dom}
                            </div>
                        );
                    },
                }}
                menuHeaderRender={(logo, title) => (
                    <div onClick={() => navigate('/')}>
                        {logo}
                        {title}
                    </div>
                )}
            >
                <Outlet/>
            </ProLayout>
        </ConfigProvider>
    );
};

export default MainLayout;
