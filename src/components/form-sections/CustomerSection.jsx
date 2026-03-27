import React from "react";
import { Button, Card, Col, Form, Input, Row, Select, Space, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

const CustomerSection = ({
  isEdit,
  isReadOnly,
  isDuplicate,
  customers,
  customerLocations,
  selectedCustomer,
  jobMode,
  previousJobs,
  showCustomerCreator,
  setShowCustomerCreator,
  customerNameInput,
  setCustomerNameInput,
  customerLocationInput,
  setCustomerLocationInput,
  addingCustomer,
  handleAddCustomer,
  handleCustomerChange,
  handleJobModeChange,
  handlePreviousJob,
}) => {
  return (
    <Card title={<Space><UserOutlined /> Customer</Space>} className="form-section-card">
      {!isEdit && !isReadOnly && (
        <div className="customer-creator-card">
          <div className="customer-creator-head">
            <Text strong>Create New Customer</Text>
            <Button
              type="link"
              onClick={() => setShowCustomerCreator((prev) => !prev)}
              style={{ paddingInline: 0 }}
            >
              {showCustomerCreator ? "Hide" : "Add New"}
            </Button>
          </div>

          {showCustomerCreator && (
            <Row gutter={[12, 12]} className="customer-creator-row">
              <Col xs={24} md={10}>
                <Input
                  placeholder="Customer name (e.g., Zenith Pharma)"
                  value={customerNameInput}
                  onChange={(event) => setCustomerNameInput(event.target.value)}
                />
              </Col>
              <Col xs={24} md={10}>
                <Input
                  placeholder="Location (e.g., Ambattur, Chennai)"
                  value={customerLocationInput}
                  onChange={(event) => setCustomerLocationInput(event.target.value)}
                />
              </Col>
              <Col xs={24} md={4}>
                <Button type="primary" block loading={addingCustomer} onClick={handleAddCustomer}>
                  Save
                </Button>
              </Col>
            </Row>
          )}
        </div>
      )}

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item label="Customer Name" name="customer_name" rules={[{ required: true, message: "Select customer" }]}>
            <Select placeholder="Select customer" onChange={handleCustomerChange} disabled={isEdit}>
              {customers.map((customer) => (
                <Select.Option key={customer} value={customer}>{customer}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Location" name="customer_location">
            <Input placeholder="Customer location" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Job Reference" name="job_mode">
            <Select onChange={handleJobModeChange} disabled={isEdit || isDuplicate}>
              <Select.Option value="New">New Job</Select.Option>
              <Select.Option value="Old">Old Job</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Existing Job (for auto-fill)" name="previous_job" style={{ marginBottom: 0 }}>
        <Select
          placeholder="Select old job"
          disabled={!selectedCustomer || jobMode !== "Old" || isEdit || isDuplicate}
          onChange={handlePreviousJob}
          allowClear
        >
          {previousJobs.map((job) => (
            <Select.Option key={job.id} value={job.id}>
              {job.job_no} - {job.job_name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Card>
  );
};

export default React.memo(CustomerSection);
