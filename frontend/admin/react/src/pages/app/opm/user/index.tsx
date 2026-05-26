import { Card, Empty } from 'antd';
import { useTranslation } from 'react-i18next';

/**
 * 用户管理页面
 */
const UserManagement = () => {
  const { t } = useTranslation('common');
  return (
    <Card>
      <Empty description={t('placeholder.underDevelopment', { pageName: '\u7528\u6237\u7ba1\u7406\u9875\u9762' })} />
    </Card>
  );
};

export default UserManagement;
