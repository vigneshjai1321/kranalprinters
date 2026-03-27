import { Card, Col, Modal, Row, Tag, Typography } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useState } from "react";
import JobForm from "../components/JobForm.jsx";

const { Text, Title } = Typography;

const statusConfig = [
  { key: "Pending", color: "red" },
  { key: "In Progress", color: "orange" },
  { key: "Completed", color: "green" },
];

export default function JobStatusBoard({
  jobs,
  customers,
  customerLocations,
  suggestedJobNo,
}) {
  const [open, setOpen] = useState(false);
  const [activeJob, setActiveJob] = useState(null);

  const openViewer = (job) => {
    setActiveJob(job);
    setOpen(true);
  };

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>Job Status Board</Title>
      <Row gutter={[16, 16]}>
        {statusConfig.map((status) => {
          const statusJobs = jobs.filter((job) => job.status === status.key);

          return (
            <Col xs={24} md={8} key={status.key}>
              <Card
                title={<Tag color={status.color}>{status.key}</Tag>}
                className="kanban-column"
                bodyStyle={{ display: "grid", gap: 12 }}
              >
                {statusJobs.length === 0 ? (
                  <Text type="secondary">No jobs</Text>
                ) : (
                  statusJobs.map((job) => (
                    <Card
                      key={job.id}
                      size="small"
                      className="kanban-card board-view-card"
                      onClick={() => openViewer(job)}
                      hoverable
                    >
                      <div className="board-card-top">
                        <Tag color="blue" icon={<EyeOutlined />}>View</Tag>
                        <Text strong className="board-job-no">{job.job_no}</Text>
                      </div>
                      <Text strong className="board-job-name">{job.job_name}</Text>
                      <div className="board-card-bottom">
                        <Text type="secondary">{job.customer_name}</Text>
                        <Tag color="geekblue">Qty: {job.quantity}</Tag>
                      </div>
                    </Card>
                  ))
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal
        title={activeJob ? `Job Details - ${activeJob.job_no}` : "Job Details"}
        open={open}
        onCancel={() => setOpen(false)}
        width="calc(100vw - 24px)"
        footer={null}
        style={{ top: 12, paddingBottom: 12, maxWidth: "none" }}
        destroyOnHidden
        className="jobs-editor-modal"
      >
        {activeJob ? (
          <JobForm
            mode="view"
            initialData={activeJob}
            customers={customers}
            customerLocations={customerLocations}
            jobs={jobs}
            suggestedJobNo={suggestedJobNo}
            onCancel={() => setOpen(false)}
          />
        ) : null}
      </Modal>
    </div>
  );
}
