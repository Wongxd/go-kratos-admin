import {Card, Row, Col, Statistic} from 'antd';
import {
    UserOutlined,
    TeamOutlined,
    ShoppingCartOutlined,
    DollarOutlined
} from '@ant-design/icons';
import PageContainer from '@/components/common/PageContainer';

const Dashboard = () => {
    return (
        <PageContainer title="仪表盘">
            <Row gutter={16}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="用户总数"
                            value={1128}
                            prefix={<UserOutlined/>}
                            valueStyle={{color: '#3f8600'}}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="活跃用户"
                            value={93}
                            suffix="/ 100"
                            prefix={<TeamOutlined/>}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="订单数"
                            value={8234}
                            prefix={<ShoppingCartOutlined/>}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="销售额"
                            value={112893}
                            prefix={<DollarOutlined/>}
                            precision={2}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="最近活动" style={{marginTop: 16}}>
                <p>欢迎使用 Go Admin 管理系统</p>
            </Card>
        </PageContainer>
    );
};

export default Dashboard;

