/**
 * 职位模块枚举映射常量
 */

type TFn = (key: string, options?: Record<string, any>) => string;

// ========== 职位状态（ON/OFF） ==========

export const STATUS_COLORS: Record<string, string> = {
  ON: 'success',
  OFF: 'error',
};

export function getStatusMap(t: TFn) {
  return {
    ON: { text: t('statusMap.ON'), color: STATUS_COLORS.ON },
    OFF: { text: t('statusMap.OFF'), color: STATUS_COLORS.OFF },
  };
}

export function getStatusOptions(t: TFn) {
  return [
    { label: t('statusMap.ON'), value: 'ON' },
    { label: t('statusMap.OFF'), value: 'OFF' },
  ];
}

// ========== 职位类型 ==========

export const POSITION_TYPE_COLORS: Record<string, string> = {
  REGULAR: 'blue',
  CONTRACT: 'green',
  INTERNSHIP: 'orange',
  PART_TIME: 'cyan',
  OUTSOURCE: 'purple',
};

export function getPositionTypeMap(t: TFn) {
  return {
    REGULAR: { text: t('typeMap.REGULAR'), color: POSITION_TYPE_COLORS.REGULAR },
    CONTRACT: { text: t('typeMap.CONTRACT'), color: POSITION_TYPE_COLORS.CONTRACT },
    INTERNSHIP: { text: t('typeMap.INTERNSHIP'), color: POSITION_TYPE_COLORS.INTERNSHIP },
    PART_TIME: { text: t('typeMap.PART_TIME'), color: POSITION_TYPE_COLORS.PART_TIME },
    OUTSOURCE: { text: t('typeMap.OUTSOURCE'), color: POSITION_TYPE_COLORS.OUTSOURCE },
  };
}

export function getPositionTypeOptions(t: TFn) {
  return [
    { label: t('typeMap.REGULAR'), value: 'REGULAR' },
    { label: t('typeMap.CONTRACT'), value: 'CONTRACT' },
    { label: t('typeMap.INTERNSHIP'), value: 'INTERNSHIP' },
    { label: t('typeMap.PART_TIME'), value: 'PART_TIME' },
    { label: t('typeMap.OUTSOURCE'), value: 'OUTSOURCE' },
  ];
}

// ========== 组织树构建 ==========

/**
 * 将 API 返回的树形组织数据转为 TreeSelect 格式
 */
export function buildOrgTreeData(items: any[]): any[] {
  const result: any[] = [];

  for (const item of items) {
    const node: any = {
      id: item.id,
      key: item.id,
      value: item.id,
      title: item.name || String(item.id),
      label: item.name || String(item.id),
    };

    if (item.children && item.children.length > 0) {
      const children = buildOrgTreeData(item.children);
      if (children.length > 0) {
        node.children = children;
      }
    }

    result.push(node);
  }

  return result;
}
