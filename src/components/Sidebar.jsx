import {
  CloseOutlined,
  DashboardOutlined,
  FileTextOutlined,
  HomeOutlined,
  MenuOutlined,
  PlusCircleOutlined,
  PrinterOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, Typography } from "antd";
import { useEffect, useState } from "react";

const { Sider } = Layout;
const { Text } = Typography;

export default function Sidebar({ selectedKey, onNavigate, onCreateJobClick }) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 992 : false
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleNavigate = (path) => {
    onNavigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleCreate = () => {
    onCreateJobClick();
    if (isMobile) setMobileOpen(false);
  };

  return (
    <>
      {isMobile && (
        <Button
          type="primary"
          shape="circle"
          icon={mobileOpen ? <CloseOutlined /> : <MenuOutlined />}
          className="mobile-menu-trigger"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        />
      )}

      {isMobile && mobileOpen && <div className="crm-mobile-backdrop" onClick={() => setMobileOpen(false)} />}

      <Sider
        width={252}
        className={`crm-sider ${isMobile ? "crm-sider-mobile" : ""} ${isMobile && mobileOpen ? "crm-sider-mobile-open" : ""}`}
      >
        <div className="crm-sider-inner">
          <div className="crm-sider-head">
            <div className="crm-sider-logo-wrap">
              <PrinterOutlined className="crm-sider-logo" />
            </div>
            <div className="crm-sider-brand">
              <Text strong className="crm-sider-title">Kranal Prints</Text>
              <Text className="crm-sider-subtitle">Creative Print Workflow</Text>
            </div>
          </div>

          <div className="crm-sider-action">
            <Button
              type="primary"
              size="large"
              icon={<PlusCircleOutlined />}
              onClick={handleCreate}
              className="sidebar-create-btn"
              block
            >
              Create New Job
            </Button>
          </div>

          <Text className="crm-sider-menu-label">Navigation</Text>

          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={({ key }) => handleNavigate(key)}
            className="crm-sider-menu"
            items={[
              { key: "/", icon: <HomeOutlined />, label: "Home" },
              { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
              { key: "/jobs", icon: <FileTextOutlined />, label: "Jobs" },
              { key: "/job-status-board", icon: <ProjectOutlined />, label: "Job Status Board" },
            ]}
          />

          <div className="crm-sider-footer">
            <Text className="crm-sider-footer-text">Designed for speed, clarity, and quality output.</Text>
          </div>
        </div>
      </Sider>
    </>
  );
}
