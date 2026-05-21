import {useState} from 'react';
import {Outlet, useNavigate, useLocation} from 'react-router-dom';
import {ProLayout} from '@ant-design/pro-components';
import {ConfigProvider, theme} from 'antd';

import {useUserStore, useAuthStore} from '@/stores';
import {defaultSettings} from '@/config/settings';
import {staticRoutes} from '@/router/config/static';
import {transformRoutesToMenu} from "@/core/router/utils/menu.ts";

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {userInfo, userRoles} = useUserStore();
    const {logout} = useAuthStore();
    const [collapsed, setCollapsed] = useState(false);

    // 转换静态路由为菜单数据（这里简单使用 userRoles 作为权限过滤依据）
    const menuData = transformRoutesToMenu(staticRoutes, userRoles);

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.defaultAlgorithm,
                token: {
                    colorPrimary: defaultSettings.colorPrimary,
                    borderRadius: defaultSettings.borderRadius,
                },
            }}
        >
            <ProLayout
                title="Go Admin"
                logo="/logo.svg"
                layout={defaultSettings.layout}
                contentWidth={defaultSettings.contentWidth}
                fixedHeader={defaultSettings.fixedHeader}
                fixSiderbar={defaultSettings.fixSiderbar}
                collapsed={collapsed}
                onCollapse={setCollapsed}
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
                    src: userInfo?.avatar,
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
