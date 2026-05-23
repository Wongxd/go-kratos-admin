import { useMemo } from 'react';
import { PageContainer as ProPageContainer } from '@ant-design/pro-components';
import { Skeleton, Alert } from 'antd';
import { useUserStore } from '@/stores/user';
import { useI18n } from '@/core/i18n';
import { useBreadcrumb } from './hooks/useBreadcrumb';
import { usePageTitle } from './hooks/usePageTitle';
import { checkPagePermission } from './utils/permission';
import type { PageContainerProps } from './types';

/**
 * 企业级页面容器组件
 * 功能：自动面包屑 + 动态标题 + 权限控制 + 加载状态 + 内容区域增强
 */
export const PageContainer = ({
  // ProPageContainer 原生属性（透传）
  ghost,
  header,
  footer,
  extra,
  children,

  // 自定义属性
  title: manualTitle,
  breadcrumb: manualBreadcrumb,
  route,
  permission,
  forbiddenFallback,
  loading,
  loadingContent,
  content,
  contentPadding = true,
  contentClassName,
  keepAlive,
  pageKey,
  render,
  ...restProps
}: PageContainerProps) => {
  // 用户权限（从 userInfo 中获取 permissions）
  const { userInfo } = useUserStore();
  const userPermissions = userInfo?.permissions || [];
  const { t } = useI18n('common');

  // 计算面包屑
  const breadcrumb = useBreadcrumb({
    manual: manualBreadcrumb === false ? false : undefined,
    route,
    showHomeIcon: true,
  });

  // 计算标题
  const pageTitle = usePageTitle({
    manual: manualTitle,
    routeTitle: route?.meta?.title,
    defaultTitle: t('pageContainer.defaultTitle'),
    updateDocumentTitle: true,
  });

  // 权限检查
  const hasPermission = useMemo(() => {
    return checkPagePermission(permission, userPermissions);
  }, [permission, userPermissions]);

  // 渲染 fallback（无权限时）
  const renderForbidden = useMemo(() => {
    if (forbiddenFallback) return forbiddenFallback;

    return (
      <Alert
        type="warning"
        title={t('pageContainer.forbiddenTitle')}
        description={t('pageContainer.forbiddenDesc')}
        showIcon
        className="mt-4"
      />
    );
  }, [forbiddenFallback]);

  // 渲染加载状态
  const renderLoading = useMemo(() => {
    if (loadingContent) return loadingContent;

    return <Skeleton active paragraph={{ rows: 6 }} className="mt-4" />;
  }, [loadingContent]);

  // 自定义渲染（完全接管）
  if (render) {
    return (
      <>
        {render({
          title: pageTitle,
          breadcrumb,
          hasPermission,
          loading: loading || false,
        })}
      </>
    );
  }

  // 无权限：显示 fallback
  if (!hasPermission) {
    return (
      <ProPageContainer
        ghost={ghost}
        header={header === false ? undefined : (header as any)}
        title={header === false ? undefined : pageTitle}
        breadcrumb={
          breadcrumb === false
            ? undefined
            : (breadcrumb as any)
        }
        {...restProps}
      >
        {renderForbidden}
      </ProPageContainer>
    );
  }

  // 加载中：显示骨架屏
  if (loading) {
    return (
      <ProPageContainer
        ghost={ghost}
        header={header === false ? undefined : (header as any)}
        title={header === false ? undefined : pageTitle}
        breadcrumb={
          breadcrumb === false
            ? undefined
            : (breadcrumb as any)
        }
        {...restProps}
      >
        {renderLoading}
      </ProPageContainer>
    );
  }

  // 正常渲染
  return (
    <ProPageContainer
      ghost={ghost}
      header={header === false ? undefined : (header as any)}
      title={header === false ? undefined : pageTitle}
      breadcrumb={
        breadcrumb === false
          ? undefined
          : (breadcrumb as any)
      }
      extra={extra}
      footer={footer}
      {...restProps}
    >
      {/* 内容区域增强 */}
      <div
        className={`
          ${contentPadding ? 'p-4 md:p-6' : ''}
          ${contentClassName || ''}
        `.trim()}
        data-page-key={pageKey}
        data-keep-alive={keepAlive || undefined}
      >
        {/* 优先使用 content，否则用 children */}
        {content ?? children}
      </div>
    </ProPageContainer>
  );
};

export default PageContainer;
