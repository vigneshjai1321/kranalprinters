import React from "react";
import { Card, Col, Form, Input, InputNumber, Row, Select, Space } from "antd";
import { ScissorOutlined } from "@ant-design/icons";

const SizeCuttingSection = ({ isEdit, isReadOnly }) => {
  return (
    <Card title={<Space><ScissorOutlined /> Size & Cutting</Space>} className="form-section-card">
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item label="Job Name" name="job_name" rules={[{ required: true, message: "Enter job name" }]}>
            <Input placeholder="e.g., Dolo 10x10" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Type" name="job_type" rules={[{ required: true, message: "Select type" }]}>
            <Select placeholder="Domestic / Export" disabled={isEdit || isReadOnly}>
              <Select.Option value="Domestic">Domestic</Select.Option>
              <Select.Option value="Export">Export</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Paper / Board (GSM)" name="paper_board" rules={[{ required: true, message: "Enter paper/board" }]}>
            <Input placeholder="e.g., 300 GSM Duplex Board" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={6}>
          <Form.Item label="Size L" name="size_l" rules={[{ required: true, message: "L required" }]}>
            <InputNumber min={0.1} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="Size B" name="size_b" rules={[{ required: true, message: "B required" }]}>
            <InputNumber min={0.1} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="Size" name="size_h" rules={[{ required: true, message: "Size required" }]}>
            <InputNumber min={0.1} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="Cutting Size" name="cutting_size" rules={[{ required: true, message: "Enter cutting size" }]}>
            <Input placeholder="e.g., 18 x 12 in" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default React.memo(SizeCuttingSection);
