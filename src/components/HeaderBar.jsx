import { Layout, Space, Typography } from "antd";

const { Header } = Layout;
const { Title, Text } = Typography;

export default function HeaderBar({ pageTitle }) {
  return (
    <Header className="crm-header">
      <Title level={4} className="crm-header-title">
        Kranal Printer CRM
      </Title>
      <Space className="crm-header-page">
        <Text type="secondary">{pageTitle}</Text>
      </Space>
    </Header>
  );
}
