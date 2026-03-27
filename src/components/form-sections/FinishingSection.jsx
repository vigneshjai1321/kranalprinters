import React from "react";
import { Card, Checkbox, Col, Form, Input, InputNumber, Radio, Row, Select, Space, Typography } from "antd";
import { SettingOutlined } from "@ant-design/icons";

const { Text } = Typography;

const finishingMainOptions = ["Lamination", "Varnish", "Spot Varnish"];
const uvOptions = ["Spot UV", "Full UV", "Drip-Off"];
const conversionOptions = ["Gumming", "Punching", "Cutting"];
const processOptions = ["Lamination", "UV", "Foiling", "Embossing", "Die Cutting", "Pasting", "Folding"];

const FinishingSection = () => {
  return (
    <Card title={<Space><SettingOutlined /> Finishing</Space>} className="form-section-card finishing-card">
      <Row gutter={[14, 14]}>
        <Col xs={24} md={8}>
          <div className="finishing-group-card">
            <Text className="finishing-group-title">Lamination / Varnish</Text>
            <Form.Item name="finishing_main" className="finishing-item" style={{ marginBottom: 0 }}>
              <Checkbox.Group options={finishingMainOptions} className="finishing-choice-grid" />
            </Form.Item>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="finishing-group-card">
            <Text className="finishing-group-title">UV Options</Text>
            <Form.Item name="uv_finish" className="finishing-item" style={{ marginBottom: 0 }}>
              <Checkbox.Group options={uvOptions} className="finishing-choice-grid" />
            </Form.Item>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="finishing-group-card">
            <Text className="finishing-group-title">Gumming / Punching / Cutting</Text>
            <Form.Item name="conversion_finish" className="finishing-item" style={{ marginBottom: 0 }}>
              <Checkbox.Group options={conversionOptions} className="finishing-choice-grid" />
            </Form.Item>
          </div>
        </Col>
      </Row>

      <Row gutter={[14, 14]} style={{ marginTop: 2 }}>
        <Col xs={24} md={8}>
          <div className="finishing-group-card">
            <Text className="finishing-group-title">Cylinder Ready</Text>
            <Form.Item name="cylinder_ready" className="finishing-item" style={{ marginBottom: 0 }}>
              <Radio.Group className="job-radio-inline finishing-radio-inline">
                <Radio value="Yes">Yes</Radio>
                <Radio value="No">No</Radio>
              </Radio.Group>
            </Form.Item>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="finishing-group-card">
            <Text className="finishing-group-title">Border Waste (mm)</Text>
            <Form.Item name="border_waste_mm" className="finishing-item" style={{ marginBottom: 0 }}>
              <InputNumber min={0} style={{ width: "100%" }} placeholder="Enter border waste" />
            </Form.Item>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="finishing-group-card">
            <Text className="finishing-group-title">Core Processes</Text>
            <Form.Item name="processes" className="finishing-item" style={{ marginBottom: 0 }}>
              <Checkbox.Group options={processOptions} className="finishing-choice-grid" />
            </Form.Item>
          </div>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 14 }}>
        <Col xs={24} md={8}>
          <Form.Item label="Folding (L x B)" name="folding_size">
            <Input placeholder="e.g., 8 x 4" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Die Size (X x Y x X/W)" name="die_size">
            <Input placeholder="e.g., 8 x 4 x 2 / W" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Die Type" name="die_type">
            <Select placeholder="Old / New">
              <Select.Option value="Old Die">Old Die</Select.Option>
              <Select.Option value="New Die">New Die</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item label="Pasting" name="pasting_type">
            <Select placeholder="Select pasting">
              <Select.Option value="Single">Single</Select.Option>
              <Select.Option value="Bottom">Bottom</Select.Option>
              <Select.Option value="CC">CC</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default React.memo(FinishingSection);
