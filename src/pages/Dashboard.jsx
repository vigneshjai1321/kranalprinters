import { Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import JobCard from "../components/JobCard.jsx";

const { Title, Text } = Typography;

function getLast7DaysTrend(jobs) {
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      key,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      total: jobs.filter((job) => job.created_at === key).length,
    });
  }

  return days;
}

function buildSparkPath(points, width = 320, height = 110) {
  if (!points.length) return "";
  const max = Math.max(...points.map((p) => p.total), 1);

  return points
    .map((p, i) => {
      const x = (i / (points.length - 1 || 1)) * width;
      const y = height - (p.total / max) * (height - 8) - 4;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function Dashboard({ jobs }) {
  const navigate = useNavigate();
  const total = jobs.length;
  const pending = jobs.filter((job) => job.status === "Pending").length;
  const inProgress = jobs.filter((job) => job.status === "In Progress").length;
  const completed = jobs.filter((job) => job.status === "Completed").length;
  const totalQty = jobs.reduce((sum, job) => sum + Number(job.quantity || 0), 0);

  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const trend = getLast7DaysTrend(jobs);
  const sparkPath = buildSparkPath(trend);

  const machineData = Object.entries(
    jobs.reduce((acc, job) => {
      acc[job.machine] = (acc[job.machine] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([machine, count]) => ({ machine, count }))
    .sort((a, b) => b.count - a.count);

  const customerData = Object.entries(
    jobs.reduce((acc, job) => {
      const key = job.customer_name;
      acc[key] = (acc[key] || 0) + Number(job.quantity || 0);
      return acc;
    }, {})
  )
    .map(([customer, qty]) => ({ customer, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const statusDistribution = [
    { label: "Pending", value: pending, color: "#ef4444" },
    { label: "In Progress", value: inProgress, color: "#f97316" },
    { label: "Completed", value: completed, color: "#22c55e" },
  ];

  const today = new Date().toISOString().slice(0, 10);
  const todayJobs = jobs.filter((job) => job.created_at === today);
  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.last_updated_at || b.created_at).getTime() - new Date(a.last_updated_at || a.created_at).getTime())
    .slice(0, 6);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="stat-card dashboard-premium-card dashboard-click-card"
            onClick={() => navigate("/jobs")}
            hoverable
          >
            <Statistic title="Total Jobs" value={total} valueStyle={{ color: "#1d4ed8" }} prefix={<RiseOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="stat-card dashboard-premium-card dashboard-click-card"
            onClick={() => navigate("/jobs?status=Pending")}
            hoverable
          >
            <Statistic title="Pending" value={pending} valueStyle={{ color: "#dc2626" }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="stat-card dashboard-premium-card dashboard-click-card"
            onClick={() => navigate("/jobs?status=In%20Progress")}
            hoverable
          >
            <Statistic title="In Progress" value={inProgress} valueStyle={{ color: "#ea580c" }} prefix={<FireOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="stat-card dashboard-premium-card dashboard-click-card"
            onClick={() => navigate("/jobs?status=Completed")}
            hoverable
          >
            <Statistic title="Completed" value={completed} valueStyle={{ color: "#16a34a" }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="7-Day Job Trend" className="dashboard-chart-card">
            <div className="trend-wrap">
              <svg viewBox="0 0 320 120" width="100%" height="120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path d={`${sparkPath} L320,120 L0,120 Z`} fill="url(#trendFill)" />
                <path d={sparkPath} stroke="#2563eb" strokeWidth="3" fill="none" />
              </svg>
            </div>
            <div className="trend-label-row">
              {trend.map((item) => (
                <div className="trend-label" key={item.key}>
                  <Text type="secondary">{item.label}</Text>
                  <Tag color="blue">{item.total}</Tag>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Output Overview" className="dashboard-chart-card">
            <Space direction="vertical" align="center" style={{ width: "100%" }}>
              <Progress type="dashboard" percent={completionRate} size={160} strokeColor="#22c55e" />
              <Text strong>Completion Rate</Text>
              <Text type="secondary">Total Qty: {totalQty.toLocaleString()}</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Status Distribution" className="dashboard-chart-card">
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              {statusDistribution.map((item) => {
                const percent = total ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="metric-row">
                      <Text strong>{item.label}</Text>
                      <Text>{item.value} jobs</Text>
                    </div>
                    <Progress percent={percent} showInfo={false} strokeColor={item.color} trailColor="#e5e7eb" />
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Machine Utilization" className="dashboard-chart-card">
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              {machineData.map((item) => {
                const percent = total ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div
                    key={item.machine}
                    className="dashboard-machine-row"
                    onClick={() => navigate(`/jobs?machine=${encodeURIComponent(item.machine)}`)}
                  >
                    <div className="metric-row">
                      <Text strong>{item.machine}</Text>
                      <Text>{item.count} jobs</Text>
                    </div>
                    <Progress percent={percent} showInfo={false} strokeColor="#2563eb" trailColor="#dbeafe" />
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Top Customers by Quantity" className="dashboard-chart-card">
            <List
              dataSource={customerData}
              renderItem={(item) => (
                <List.Item className="dashboard-customer-row" onClick={() => navigate(`/jobs?customer=${encodeURIComponent(item.customer)}`)}>
                  <div className="metric-row" style={{ width: "100%" }}>
                    <Text>{item.customer}</Text>
                    <Tag color="blue">{item.qty.toLocaleString()}</Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>Recent Job Dockets</Title>}
            extra={<Tag color="blue">{recentJobs.length} Shown</Tag>}
            className="dashboard-chart-card"
          >
            <Row gutter={[12, 12]}>
              {(todayJobs.length ? todayJobs.slice(0, 6) : recentJobs).map((job) => (
                <Col xs={24} md={12} key={job.id}>
                  <JobCard job={job} showDownload={false} />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
