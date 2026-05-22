import { Button, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';

interface ControlPanelProps {
  collapsed: boolean;
  isDark: boolean;
  onToggleCollapse: () => void;
  onToggleTheme: () => void;
}

export const ControlPanel = ({
  collapsed,
  isDark,
  onToggleCollapse,
  onToggleTheme,
}: ControlPanelProps) => {
  return (
    <div
      style={{
        borderTop: `1px solid ${isDark ? '#303030' : '#e5e7eb'}`,
        padding: collapsed ? '8px 4px' : '8px 12px',
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 4,
        flexShrink: 0,
      }}
    >
      {/* 折叠按钮 */}
      <Tooltip title={collapsed ? '展开侧边栏' : '收起侧边栏'}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          size="small"
          style={{
            color: isDark ? '#a6a6a6' : '#595959',
          }}
        />
      </Tooltip>

      {/* 主题切换按钮 */}
      {!collapsed && (
        <Tooltip title={isDark ? '切换到亮色模式' : '切换到暗色模式'}>
          <Button
            type="text"
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={onToggleTheme}
            size="small"
            style={{
              color: isDark ? '#a6a6a6' : '#595959',
            }}
          />
        </Tooltip>
      )}
    </div>
  );
};

export default ControlPanel;
