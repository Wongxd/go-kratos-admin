import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Tabs, Dropdown, type MenuProps, type TabsProps } from 'antd';
import { useLocation, useNavigate, useMatches } from 'react-router-dom';
import {
  CloseOutlined,
  PushpinOutlined,
  PushpinFilled,
  FullscreenOutlined,
  ReloadOutlined,
  ExportOutlined,
  LeftOutlined,
  RightOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { usePreferencesStore } from '@/core/preferences/store';
import { useTabsStore } from '@/stores/tabs';
import { useI18n } from '@/core/i18n';

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

  const { t } = useI18n('common');

  // 标签页管理
  const {
    tabs,
    addTab,
    closeTab,
    closeLeftTabs,
    closeRightTabs,
    closeOtherTabs,
    closeAllTabs,
    togglePinTab,
    reloadTab,
  } = useTabsStore();

  // 右键菜单状态
  const [contextMenuTabKey, setContextMenuTabKey] = useState<string>('');

  // 当前标签
  const currentTab = useMemo(() => {
    const lastMatch = matches.at(-1) as any;
    const title = lastMatch?.handle?.title || lastMatch?.data?.title || '未知页面';
    return {
      key: location.pathname,
      path: location.pathname,
      title,
      closable: location.pathname !== '/',
    };
  }, [location.pathname, matches]);

  // 自动添加当前标签
  useEffect(() => {
    addTab(currentTab);
  }, [currentTab, addTab]);

  // 构建标签列表
  const tabItems: TabItem[] = useMemo(() => {
    return tabs.map((tab) => ({
      key: tab.key,
      label: tab.title,
      closable: tab.closable,
    }));
  }, [tabs]);

  // 处理标签切换
  const handleTabChange = useCallback(
    (key: string) => {
      navigate(key);
    },
    [navigate]
  );

  // 处理标签关闭
  const handleTabRemove = useCallback(
    (targetKey: string) => {
      closeTab(targetKey);

      // 如果关闭的是当前激活的标签，跳转到其他标签
      if (targetKey === location.pathname) {
        const currentIndex = tabs.findIndex((tab) => tab.key === targetKey);
        if (currentIndex > 0) {
          // 跳转到前一个标签
          navigate(tabs[currentIndex - 1].key);
        } else if (tabs.length > 1) {
          // 跳转到后一个标签
          navigate(tabs[1].key);
        } else {
          // 跳转到首页
          navigate('/');
        }
      }
    },
    [closeTab, location.pathname, tabs, navigate]
  );

  // 右键菜单
  const contextMenuItems: MenuProps['items'] = useMemo(() => {
    const currentTabData = tabs.find((tab) => tab.key === contextMenuTabKey);
    if (!currentTabData) return [];

    const isHome = contextMenuTabKey === '/';
    const isPinned = currentTabData.pinned;
    const currentIndex = tabs.findIndex((tab) => tab.key === contextMenuTabKey);

    const items: MenuProps['items'] = [
      {
        key: 'close',
        label: t('tabs.close'),
        icon: <CloseOutlined />,
        disabled: !currentTabData.closable,
        onClick: () => handleTabRemove(contextMenuTabKey),
      },
      {
        key: 'pin',
        label: isPinned ? t('tabs.unpin') : t('tabs.pin'),
        icon: isPinned ? <PushpinFilled /> : <PushpinOutlined />,
        onClick: () => togglePinTab(contextMenuTabKey),
      },
      {
        type: 'divider',
      },
      {
        key: 'reload',
        label: t('tabs.reload'),
        icon: <ReloadOutlined />,
        onClick: () => {
          reloadTab(contextMenuTabKey);
          // 触发页面刷新
          if (contextMenuTabKey === location.pathname) {
            // 刷新当前页面
            window.location.reload();
          }
        },
      },
      {
        key: 'maximize',
        label: t('tabs.maximize'),
        icon: <FullscreenOutlined />,
        // 最大化功能后续实现
      },
      {
        key: 'newWindow',
        label: t('tabs.openInNewWindow'),
        icon: <ExportOutlined />,
        onClick: () => {
          window.open(contextMenuTabKey, '_blank');
        },
      },
    ];

    // 添加分割线和批量关闭选项
    if (!isHome && tabs.length > 1) {
      items.push(
        { type: 'divider' },
        {
          key: 'closeLeft',
          label: t('tabs.closeLeft'),
          icon: <LeftOutlined />,
          disabled: currentIndex === 0,
          onClick: () => {
            closeLeftTabs(contextMenuTabKey);
            navigate(contextMenuTabKey);
          },
        },
        {
          key: 'closeRight',
          label: t('tabs.closeRight'),
          icon: <RightOutlined />,
          disabled: currentIndex === tabs.length - 1,
          onClick: () => {
            closeRightTabs(contextMenuTabKey);
            navigate(contextMenuTabKey);
          },
        },
        {
          key: 'closeOthers',
          label: t('tabs.closeOthers'),
          icon: <CloseCircleOutlined />,
          disabled: tabs.filter((t) => t.closable && t.key !== contextMenuTabKey).length === 0,
          onClick: () => {
            closeOtherTabs(contextMenuTabKey);
            navigate(contextMenuTabKey);
          },
        },
        {
          key: 'closeAll',
          label: t('tabs.closeAll'),
          icon: <CloseOutlined />,
          onClick: () => {
            closeAllTabs();
            navigate('/');
          },
        }
      );
    }

    return items;
  }, [contextMenuTabKey, tabs, t, handleTabRemove, togglePinTab, reloadTab, closeLeftTabs, closeRightTabs, closeOtherTabs, closeAllTabs, location.pathname, navigate]);

  // 自定义渲染 TabBar，添加右键菜单
  const renderTabBar: TabsProps['renderTabBar'] = useCallback(
    (props: any, DefaultTabBar: React.ComponentType<any>) => {
      // 为整个 TabBar 添加右键事件监听
      const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('[TabsBar] Context menu event triggered');
        
        // 从事件目标中查找最近的 tab 元素
        const target = e.target as HTMLElement;
        console.log('[TabsBar] Target element:', target);
        console.log('[TabsBar] Target className:', target.className);
        
        // 尝试多种方式查找 tab 元素
        const tabElement = 
          target.closest('.ant-tabs-tab') || 
          target.closest('.ant-tabs-tab-btn') ||
          target.parentElement?.closest('.ant-tabs-tab');
        
        console.log('[TabsBar] Found tab element:', tabElement);
        
        if (tabElement) {
          // 获取 tab 的 key（Ant Design v6 使用 data-node-key）
          const tabKey = tabElement.getAttribute('data-node-key') || 
                        tabElement.getAttribute('aria-controls')?.replace('panel-', '');
          console.log('[TabsBar] Found tab key:', tabKey);
          
          if (tabKey) {
            setContextMenuTabKey(tabKey);
          }
        } else {
          // 如果没找到 tab 元素，可能是点击在 TabBar 空白区域
          console.log('[TabsBar] No tab element found');
        }
      };

      const enhancedProps = {
        ...props,
        onContextMenu: handleContextMenu,
      };

      return (
        <Dropdown
          menu={{ items: contextMenuItems }}
          trigger={['contextMenu']}
          onOpenChange={(visible) => {
            console.log('[TabsBar] Dropdown visible:', visible);
            if (!visible) setContextMenuTabKey('');
          }}
          open={!!contextMenuTabKey}
        >
          <DefaultTabBar {...enhancedProps} />
        </Dropdown>
      );
    },
    [contextMenuItems, contextMenuTabKey]
  );

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
        items={tabItems}
        onChange={handleTabChange}
        onEdit={(_, action) => {
          if (action === 'remove' && typeof _ === 'string') {
            handleTabRemove(_);
          }
        }}
        renderTabBar={renderTabBar}
        style={{ width: '100%', margin: 0 }}
        tabBarStyle={{ margin: 0 }}
      />
    </div>
  );
};

export default TabsBar;
