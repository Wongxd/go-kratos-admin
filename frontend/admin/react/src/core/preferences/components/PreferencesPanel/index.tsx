import {Drawer, Select, ColorPicker} from 'antd';

import {usePreferencesStore} from '../../store';
import type {AuthPageLayoutType, LayoutType} from '../../types';

interface PreferencesPanelProps {
    open: boolean;
    onClose: () => void;
}

export const PreferencesPanel = ({open, onClose}: PreferencesPanelProps) => {
    const {preferences, setPreferences} = usePreferencesStore();

    const handleLayoutChange = (layout: LayoutType) => {
        setPreferences({app: {layout}});
    };

    const handleAuthLayoutChange = (layout: AuthPageLayoutType) => {
        setPreferences({app: {authPageLayout: layout}});
    };

    return (
        <Drawer title="偏好设置" placement="right" width={320} open={open} onClose={onClose}>
            <div className="space-y-6">
                {/* 布局方式 */}
                <section>
                    <h4 className="font-medium mb-3">布局方式</h4>
                    <Select
                        className="w-full"
                        value={preferences.app.layout}
                        options={[
                            {label: '侧边菜单', value: 'side'},
                            {label: '顶部菜单', value: 'top'},
                            {label: '混合菜单', value: 'mix'},
                        ]}
                        onChange={handleLayoutChange}
                    />
                </section>

                {/* 登录页布局 */}
                <section>
                    <h4 className="font-medium mb-3">登录页布局</h4>
                    <Select
                        className="w-full"
                        value={preferences.app.authPageLayout}
                        options={[
                            {label: '居中面板', value: 'panel-center'},
                            {label: '左侧面板', value: 'panel-left'},
                            {label: '右侧面板', value: 'panel-right'},
                        ]}
                        onChange={handleAuthLayoutChange}
                    />
                </section>

                {/* 主题色 */}
                <section>
                    <h4 className="font-medium mb-3">主题色</h4>
                    <ColorPicker
                        value={preferences.theme.colorPrimary}
                        onChange={(color) =>
                            setPreferences({theme: {colorPrimary: color.toHexString()}})
                        }
                    />
                </section>
            </div>
        </Drawer>
    );
};
