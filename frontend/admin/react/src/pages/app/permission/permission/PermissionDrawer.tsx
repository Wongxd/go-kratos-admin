import { useRef, useState, useEffect } from 'react';
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormText,
  ProFormRadio,
} from '@ant-design/pro-components';
import { App, TreeSelect, Form, Tree, Spin } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { PaginationQuery } from '@/core';
import { useCreatePermission, useUpdatePermission } from '@/api/hooks/permission';
import { fetchListPermissionGroups } from '@/api/hooks/permission-group';
import { fetchListMenus } from '@/api/hooks/menu';
import { fetchListApis } from '@/api/hooks/api';
import {
  getStatusOptions,
  buildTreeSelectData,
  buildMenuTree,
  buildApiTree,
  filterNumbers,
} from './constants';

interface PermissionDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  data?: any;
  groupId: number;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 权限点编辑/创建抽屉组件
 */
const PermissionDrawer: React.FC<PermissionDrawerProps> = ({
  open,
  mode,
  data,
  groupId,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation('permission');
  const formRef = useRef<ProFormInstance>(null);
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const [confirmLoading, setConfirmLoading] = useState(false);

  // 分组下拉数据
  const [groupTreeData, setGroupTreeData] = useState<any[]>([]);

  // 菜单树数据 + 勾选
  const [menuTreeData, setMenuTreeData] = useState<any[]>([]);
  const [menuCheckedKeys, setMenuCheckedKeys] = useState<number[]>([]);
  const [menuTreeLoading, setMenuTreeLoading] = useState(false);

  // API 树数据 + 勾选
  const [apiTreeData, setApiTreeData] = useState<any[]>([]);
  const [apiCheckedKeys, setApiCheckedKeys] = useState<number[]>([]);
  const [apiTreeLoading, setApiTreeLoading] = useState(false);

  // 加载树形数据
  useEffect(() => {
    if (open) {
      // 加载分组下拉
      fetchListPermissionGroups(new PaginationQuery({ formValues: { status: 'ON' } }))
        .then((res) => {
          setGroupTreeData(buildTreeSelectData(res?.items || []));
        })
        .catch(() => setGroupTreeData([]));

      // 加载菜单树
      setMenuTreeLoading(true);
      fetchListMenus(new PaginationQuery({ formValues: { status: 'ON' } }))
        .then((res) => {
          setMenuTreeData(buildMenuTree(res?.items));
        })
        .catch(() => setMenuTreeData([]))
        .finally(() => setMenuTreeLoading(false));

      // 加载 API 树
      setApiTreeLoading(true);
      fetchListApis(new PaginationQuery({}))
        .then((res) => {
          setApiTreeData(buildApiTree(res?.items, t));
        })
        .catch(() => setApiTreeData([]))
        .finally(() => setApiTreeLoading(false));
    }
  }, [open]);

  // 编辑模式下设置表单值 + 勾选状态
  useEffect(() => {
    if (open && mode === 'edit' && data) {
      setTimeout(() => {
        formRef.current?.setFieldsValue({
          name: data.name || '',
          code: data.code || '',
          groupId: data.groupId || groupId,
          status: data.status || 'ON',
        });
      }, 0);

      // 设置菜单和 API 的勾选
      if (Array.isArray(data.menuIds)) {
        setMenuCheckedKeys(data.menuIds.filter((v: any) => typeof v === 'number'));
      }
      if (Array.isArray(data.apiIds)) {
        setApiCheckedKeys(data.apiIds.filter((v: any) => typeof v === 'number'));
      }
    }
  }, [open, mode, data, groupId]);

  // 创建 mutation
  const createMutation = useCreatePermission({
    onSuccess: () => {
      message.success(t('createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['listPermissions'] });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      message.error(error.message || t('createFailed'));
    },
  });

  // 更新 mutation
  const updateMutation = useUpdatePermission({
    onSuccess: () => {
      message.success(t('updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['listPermissions'] });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      message.error(error.message || t('updateFailed'));
    },
  });

  // 提交表单
  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setConfirmLoading(true);

      const payload = {
        ...values,
        menuIds: filterNumbers(menuCheckedKeys),
        apiIds: filterNumbers(apiCheckedKeys),
      };

      if (mode === 'edit' && data?.id) {
        await updateMutation.mutateAsync({ id: data.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload as any);
      }
      return true;
    } catch {
      return false;
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <DrawerForm
      formRef={formRef}
      title={mode === 'create' ? t('create') : t('edit')}
      open={open}
      onOpenChange={(visible) => {
        if (!visible) {
          formRef.current?.resetFields();
          setMenuCheckedKeys([]);
          setApiCheckedKeys([]);
          onClose();
        }
      }}
      initialValues={{
        status: 'ON',
        groupId,
      }}
      onFinish={handleSubmit}
      submitter={{
        searchConfig: {
          submitText: t('common:button.submit'),
          resetText: t('common:button.cancel'),
        },
        submitButtonProps: {
          loading: confirmLoading || createMutation.isPending || updateMutation.isPending,
        },
        resetButtonProps: { onClick: onClose },
      }}
      drawerProps={{ destroyOnClose: true, onClose, styles: { wrapper: { width: 700 } } }}
    >
      <ProFormText
        name="name"
        label={t('name')}
        placeholder={t('namePlaceholder')}
        rules={[{ required: true, message: t('requiredName') }]}
        fieldProps={{ allowClear: true }}
      />

      <ProFormText
        name="code"
        label={t('code')}
        placeholder={t('codePlaceholder')}
        rules={[{ required: true, message: t('requiredCode') }]}
        fieldProps={{ allowClear: true }}
      />

      {/* 所属分组 - TreeSelect（单选） */}
      <Form.Item
        name="groupId"
        label={t('groupId')}
        rules={[{ required: true, message: t('requiredGroupId') }]}
      >
        <TreeSelect
          treeData={groupTreeData}
          placeholder={t('groupIdPlaceholder')}
          allowClear
          showSearch
          treeDefaultExpandAll
        />
      </Form.Item>

      <ProFormRadio.Group
        name="status"
        label={t('status')}
        rules={[{ required: true, message: t('requiredStatus') }]}
        options={getStatusOptions(t)}
        fieldProps={{ optionType: 'button', buttonStyle: 'solid' }}
      />

      {/* 关联菜单 - Tree（勾选） */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, color: 'var(--ant-color-text)' }}>
          {t('menuIds')}
        </label>
        <Spin spinning={menuTreeLoading}>
          {menuTreeData.length > 0 ? (
            <Tree
              checkable
              checkedKeys={menuCheckedKeys}
              onCheck={(checked) => {
                setMenuCheckedKeys(checked as number[]);
              }}
              treeData={menuTreeData}
              defaultExpandAll
              style={{
                maxHeight: 300,
                overflow: 'auto',
                border: '1px solid var(--ant-color-border)',
                borderRadius: 6,
                padding: 8,
              }}
            />
          ) : (
            <div
              style={{
                color: 'var(--ant-color-text-quaternary)',
                padding: 16,
                textAlign: 'center',
                border: '1px dashed var(--ant-color-border)',
                borderRadius: 6,
              }}
            >
              {menuTreeLoading ? '' : t('menuIdsPlaceholder')}
            </div>
          )}
        </Spin>
      </div>

      {/* 关联API - Tree（勾选） */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, color: 'var(--ant-color-text)' }}>
          {t('apiIds')}
        </label>
        <Spin spinning={apiTreeLoading}>
          {apiTreeData.length > 0 ? (
            <Tree
              checkable
              checkedKeys={apiCheckedKeys}
              onCheck={(checked) => {
                setApiCheckedKeys(checked as number[]);
              }}
              treeData={apiTreeData}
              defaultExpandAll
              style={{
                maxHeight: 300,
                overflow: 'auto',
                border: '1px solid var(--ant-color-border)',
                borderRadius: 6,
                padding: 8,
              }}
            />
          ) : (
            <div
              style={{
                color: 'var(--ant-color-text-quaternary)',
                padding: 16,
                textAlign: 'center',
                border: '1px dashed var(--ant-color-border)',
                borderRadius: 6,
              }}
            >
              {apiTreeLoading ? '' : t('apiIdsPlaceholder')}
            </div>
          )}
        </Spin>
      </div>
    </DrawerForm>
  );
};

export default PermissionDrawer;
