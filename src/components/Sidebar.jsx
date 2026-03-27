import {
  DoubleLeftOutlined,
  DoubleRightOutlined,
  CloseOutlined,
  DashboardOutlined,
  FileTextOutlined,
  HomeOutlined,
  MenuOutlined,
  PlusCircleOutlined,
  PrinterOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, Tooltip, Typography } from "antd";
import { useEffect, useState } from "react";

const { Sider } = Layout;
const { Text } = Typography;

export default function Sidebar({ selectedKey, onNavigate, onCreateJobClick }) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 992 : false
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileOpen(false);
      } else {
        setCollapsed(false);
      }
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

  const isCollapsed = !isMobile && collapsed;

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
        collapsedWidth={88}
        collapsed={isCollapsed}
        trigger={null}
        className={`crm-sider ${isCollapsed ? "crm-sider-collapsed" : ""} ${isMobile ? "crm-sider-mobile" : ""} ${isMobile && mobileOpen ? "crm-sider-mobile-open" : ""}`}
      >
        <div className="crm-sider-inner">
          <div className="crm-sider-head">
            <div className="crm-sider-logo-wrap">
              <PrinterOutlined className="crm-sider-logo" />
            </div>
            <div className={`crm-sider-brand ${isCollapsed ? "crm-sider-brand-hidden" : ""}`}>
              <Text strong className="crm-sider-title">Kranal Prints</Text>
              <Text className="crm-sider-subtitle">Creative Print Workflow</Text>
            </div>
            {!isMobile ? (
              <Button
                type="text"
                shape="circle"
                className="crm-sider-toggle"
                icon={isCollapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              />
            ) : null}
          </div>

          <div className="crm-sider-action">
            <Tooltip title={isCollapsed ? "Create New Job" : ""} placement="right">
              <Button
                type="primary"
                size="large"
                icon={<PlusCircleOutlined />}
                onClick={handleCreate}
                className={`sidebar-create-btn ${isCollapsed ? "sidebar-create-btn-collapsed" : ""}`}
                block
              >
                {isCollapsed ? null : "Create New Job"}
              </Button>
            </Tooltip>
          </div>

          {!isCollapsed ? <Text className="crm-sider-menu-label">Navigation</Text> : null}

          <Menu
            mode="inline"
            inlineCollapsed={isCollapsed}
            selectedKeys={[selectedKey]}
            onClick={({ key }) => handleNavigate(key)}
            className="crm-sider-menu"
            items={[
              { key: "/", icon: <HomeOutlined />, label: "Home", title: "Home" },
              { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard", title: "Dashboard" },
              { key: "/jobs", icon: <FileTextOutlined />, label: "Jobs", title: "Jobs" },
              { key: "/job-status-board", icon: <ProjectOutlined />, label: "Job Status Board", title: "Job Status Board" },
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
