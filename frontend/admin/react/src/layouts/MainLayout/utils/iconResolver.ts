import React from 'react';
import * as Icons from '@ant-design/icons';

/**
 * 根据图标名称字符串解析为 Ant Design 图标组件
 * 例如 "DashboardOutlined" -> <DashboardOutlined />
 */
export const getIconFromName = (iconName?: string): React.ReactNode => {
  if (!iconName) return null;

  const IconComponent = (Icons as any)[iconName];
  if (IconComponent) {
    return React.createElement(IconComponent);
  }
  return null;
};
