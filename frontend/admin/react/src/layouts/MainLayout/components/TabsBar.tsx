import { useMemo } from 'react';
import { Tabs } from 'antd';
import { useLocation, useNavigate, useMatches } from 'react-router-dom';
import { usePreferencesStore } from '@/core/preferences/store';

interface TabItem {
  key: string;
  label: string;
  closable?: boolean;
}

export const TabsBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const preferences = usePreferencesStore((state) => state.preferences);
  const isDark = preferences.theme.mode === 'dark';

  const tabbarConfig = preferences.tabbar;

  const currentTab = useMemo((): TabItem => {
    const lastMatch = matches.at(-1) as any;
    const title = lastMatch?.handle?.title || lastMatch?.data?.title || '未知页面';
    return {
      key: location.pathname,
      label: title,
      closable: location.pathname !== '/',
    };
  }, [location.pathname, matches]);

  // 当前只有一个活动标签页，后续可扩展为多标签管理
  const items: TabItem[] = [currentTab];

  if (!tabbarConfig.enable) return null;

  return (
    <div
      style={{
        height: tabbarConfig.height,
        borderBottom: `1px solid ${isDark ? '#303030' : '#e5e7eb'}`,
        backgroundColor: isDark ? '#141414' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        flexShrink: 0,
      }}
    >
      <Tabs
        activeKey={location.pathname}
        size="small"
        type="editable-card"
        hideAdd
        items={items}
        onChange={(key) => navigate(key)}
        onEdit={() => {
          // 关闭标签逻辑（后续实现）
        }}
        style={{ width: '100%', margin: 0 }}
        tabBarStyle={{ margin: 0 }}
      />
    </div>
  );
};

export default TabsBar;
