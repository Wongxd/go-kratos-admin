import { Card, Empty } from 'antd';
import { useTranslation } from 'react-i18next';

/**
 * 用户详情页面
 */
const UserDetail = () => {
  const { t } = useTranslation('common');
  return (
    <Card>
      <Empty description={t('placeholder.underDevelopment', { pageName: '\u7528\u6237\u8be6\u60c5\u9875\u9762' })} />
    </Card>
  );
};

export default UserDetail;
