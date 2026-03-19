import { Button, Card, Space, Tag, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { getJobDesignImage } from "../utils/jobDesign";
import { downloadJobPdf } from "../utils/pdf";

const { Text } = Typography;

const statusColors = {
  Pending: "red",
  "In Progress": "orange",
  Completed: "green",
};

export default function JobCard({ job, showDownload = true }) {
  const designImage = getJobDesignImage(job);

  return (
    <Card
      hoverable
      className="job-card-enhanced"
      style={{ borderRadius: 12, border: "1px solid #dbeafe", boxShadow: "0 8px 24px rgba(37, 99, 235, 0.08)" }}
      bodyStyle={{ padding: 16 }}
    >
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <div className="job-card-image-wrap">
          <img src={designImage} alt={`${job.job_name || "Job"} design`} className="job-card-image" loading="lazy" />
        </div>
        <Text strong>{job.job_no}</Text>
        <Text>{job.customer_name}</Text>
        <Text>{job.job_name}</Text>
        <Text type="secondary">Quantity: {job.quantity}</Text>
        <Tag color={statusColors[job.status] || "default"}>{job.status}</Tag>
        {showDownload ? (
          <Button icon={<DownloadOutlined />} onClick={() => downloadJobPdf(job)} block>
            Download PDF
          </Button>
        ) : null}
      </Space>
    </Card>
  );
}
