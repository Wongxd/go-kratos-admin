import { Card, Empty } from 'antd';
import { useTranslation } from 'react-i18next';

/**
 * 字典管理页面
 */
const DictManagement = () => {
  const { t } = useTranslation('common');
  return (
    <Card>
      <Empty description={t('placeholder.underDevelopment', { pageName: '\u5b57\u5178\u7ba1\u7406\u9875\u9762' })} />
    </Card>
  );
};

export default DictManagement;
