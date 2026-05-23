import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Tabs, Dropdown, Button, Space, type MenuProps, type TabsProps } from 'antd';
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
  MoreOutlined,
} from '@ant-design/icons';
import { usePreferencesStore } from '@/core/preferences/store';
import { useTabsStore } from '@/stores/tabs';
import { useI18n } from '@/core/i18n';
import './tabsbar.css';

interface TabItem {
  key: string;
  label: React.ReactNode; // 支持图标 + 文本
  closable?: boolean;
}

/**
 * TabsBar 组件 - 多标签页导航栏
 * 支持 4 种风格：brisk | card | chrome | plain
 */
export const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const preferences = usePreferencesStore((state) => state.preferences);
  const isDark = preferences.theme.mode === 'dark';
  const tabbarConfig = preferences.tabbar;

  const { t } = useI18n('common');

  // 右键菜单状态
  const [contextMenuTabKey, setContextMenuTabKey] = useState<string>('');

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

  // 获取当前风格对应的 CSS 类名
  const tabbarClassName = useMemo(() => {
    const baseClass = 'tabsbar-container';
    const styleClass = `tabsbar-${tabbarConfig.styleType}`;
    return `${baseClass} ${styleClass}`;
  }, [tabbarConfig.styleType]);

  // 根据 styleType 映射 antd Tabs type
  const tabsType = useMemo(() => {
    switch (tabbarConfig.styleType) {
      case 'chrome':
        return 'editable-card';
      case 'card':
        return 'card';
      case 'brisk':
      case 'plain':
        return 'line';
      default:
        return 'editable-card';
    }
  }, [tabbarConfig.styleType]);

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

  // 构建标签列表（支持图标显示）
  const tabItems: TabItem[] = useMemo(() => {
    return tabs.map((tab) => ({
      key: tab.key,
      label: (
        <span className="tabsbar-tab-label">
          {tabbarConfig.showIcon && tab.icon && (
            <span className="tabsbar-tab-icon" style={{ marginRight: 4 }}>
              {tab.icon}
            </span>
          )}
          {tab.title}
        </span>
      ),
      closable: tab.closable,
    }));
  }, [tabs, tabbarConfig.showIcon]);

  // 处理标签切换
  const handleTabChange = useCallback(
    (key: string) => {
      navigate(key);
    },
    [navigate],
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
    [closeTab, location.pathname, tabs, navigate],
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
        },
      );
    }

    return items;
  }, [
    contextMenuTabKey,
    tabs,
    t,
    handleTabRemove,
    togglePinTab,
    reloadTab,
    closeLeftTabs,
    closeRightTabs,
    closeOtherTabs,
    closeAllTabs,
    location.pathname,
    navigate,
  ]);

  // 更多操作菜单
  const moreMenuItems: MenuProps['items'] = useMemo(() => {
    return [
      {
        key: 'closeLeft',
        label: t('tabs.closeLeft'),
        icon: <LeftOutlined />,
        onClick: () => {
          if (location.pathname !== '/') {
            closeLeftTabs(location.pathname);
            navigate(location.pathname);
          }
        },
      },
      {
        key: 'closeRight',
        label: t('tabs.closeRight'),
        icon: <RightOutlined />,
        onClick: () => {
          closeRightTabs(location.pathname);
          navigate(location.pathname);
        },
      },
      {
        key: 'closeOthers',
        label: t('tabs.closeOthers'),
        icon: <CloseCircleOutlined />,
        disabled: tabs.filter((t) => t.closable && t.key !== location.pathname).length === 0,
        onClick: () => {
          closeOtherTabs(location.pathname);
          navigate(location.pathname);
        },
      },
      {
        type: 'divider',
      },
      {
        key: 'closeAll',
        label: t('tabs.closeAll'),
        icon: <CloseOutlined />,
        onClick: () => {
          closeAllTabs();
          navigate('/');
        },
      },
    ];
  }, [
    tabs,
    location.pathname,
    t,
    closeLeftTabs,
    closeRightTabs,
    closeOtherTabs,
    closeAllTabs,
    navigate,
  ]);

  // 自定义渲染 TabBar，添加右键菜单和拖拽功能
  const renderTabBar: TabsProps['renderTabBar'] = useCallback(
    (props: any, DefaultTabBar: React.ComponentType<any>) => {
      // 为整个 TabBar 添加右键事件监听
      const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // 从事件目标中查找最近的 tab 元素
        const target = e.target as HTMLElement;

        // 尝试多种方式查找 tab 元素
        const tabElement =
          target.closest('.ant-tabs-tab') ||
          target.closest('.ant-tabs-tab-btn') ||
          target.parentElement?.closest('.ant-tabs-tab');

        if (tabElement) {
          // 获取 tab 的 key（Ant Design v6 使用 data-node-key）
          const tabKey =
            tabElement.getAttribute('data-node-key') ||
            tabElement.getAttribute('aria-controls')?.replace('panel-', '');

          if (tabKey) {
            setContextMenuTabKey(tabKey);
          }
        }
      };

      const enhancedProps = {
        ...props,
        onContextMenu: handleContextMenu,
      };

      // 如果启用了拖拽，这里可以集成 react-dnd 或其他拖拽库
      // 目前先使用默认的 Tabs 行为

      return (
        <Dropdown
          menu={{ items: contextMenuItems }}
          trigger={['contextMenu']}
          onOpenChange={(visible) => {
            if (!visible) setContextMenuTabKey('');
          }}
          open={!!contextMenuTabKey}
          className="tabsbar-context-menu"
        >
          <DefaultTabBar {...enhancedProps} />
        </Dropdown>
      );
    },
    [contextMenuItems, contextMenuTabKey],
  );

  if (!tabbarConfig.enable) return null;

  return (
    <div
      className={tabbarClassName}
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
        type={tabsType}
        hideAdd
        items={tabItems}
        onChange={handleTabChange}
        onEdit={(_, action) => {
          if (action === 'remove' && typeof _ === 'string') {
            handleTabRemove(_);
          }
        }}
        renderTabBar={renderTabBar}
        style={{ width: '100%', margin: 0, flex: 1 }}
        tabBarStyle={{ margin: 0 }}
        // 如果启用了 keepAlive，可以在这里配置缓存逻辑
        // destroyInactiveTabPane={!tabbarConfig.keepAlive}
      />

      {/* 更多操作按钮 */}
      {tabbarConfig.showMore && tabs.length > 1 && (
        <Space size={4} style={{ marginLeft: 8 }}>
          <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)',
              }}
            />
          </Dropdown>
        </Space>
      )}
    </div>
  );
};

export default Index;
