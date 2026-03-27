import { Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import React from "react";

const machineOptions = ["6C", "5C", "2C", "MOE", "BK"];

const JobDetailsSection = ({ isEdit }) => {
  return (
    <Card title={<Space><FileTextOutlined /> Job Details</Space>} className="form-section-card">
      <Row gutter={16}>
        <Col xs={24} md={6}>
          <Form.Item 
            label="Job Card Number" 
            name="job_no" 
            rules={[{ required: true, message: "Enter job number" }]}
          >
            <Input placeholder="e.g., JOB010" disabled={isEdit} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item 
            label="Quantity" 
            name="quantity" 
            rules={[{ required: true, message: "Enter quantity" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} placeholder="Quantity" />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="Date" name="date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="Machine" name="machine" rules={[{ required: true, message: "Select machine" }]}>
            <Select placeholder="Select machine">
              {machineOptions.map((item) => (
                <Select.Option key={item} value={item}>{item}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default React.memo(JobDetailsSection);
