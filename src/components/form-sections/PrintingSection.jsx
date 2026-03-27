import React from "react";
import { Button, Card, Checkbox, Form, Select, Space, Typography } from "antd";
import { BgColorsOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

const printingTypeOptions = ["MET-PET", "CMYK", "Pan colours"];
const printingTypeDisplayOptions = printingTypeOptions.map((value, index) => ({
  value,
  label: index < printingTypeOptions.length - 1 ? `${value},` : value,
}));

const colourNameOptions = [
  "PAN Blue 82774", "PAN Red 46129", "PAN Green 59382", "PAN Yellow 77421", "PAN Orange 68215",
  "PAN Purple 91564", "PAN Teal 34872", "PAN Grey 55691", "PAN Black 10294", "PAN White 88931",
  "Cyan", "Magenta", "Yellow", "Black",
];

const PrintingSection = () => {
  return (
    <Card title={<Space><BgColorsOutlined /> Printing</Space>} className="form-section-card">
      <Form.Item label="Printing Type" name="printing_type">
        <Checkbox.Group options={printingTypeDisplayOptions} className="job-check-grid job-check-inline" />
      </Form.Item>

      <Form.Item label="Colours">
        <Form.List name="colours">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              {fields.length === 0 && (
                <Text type="secondary">No colours added yet. Use + Add Colour.</Text>
              )}
              {fields.map((field) => {
                const { key, ...restField } = field;
                return (
                <div key={key} className="colour-line-row">
                  <div className="colour-line-index">{field.name + 1}</div>
                  <Form.Item
                    {...restField}
                    style={{ marginBottom: 0, flex: 1 }}
                    rules={[{ required: true, message: "Select a colour" }]}
                  >
                    <Select
                      showSearch
                      allowClear
                      placeholder={`Select Colour ${field.name + 1}`}
                      optionFilterProp="label"
                      options={colourNameOptions.map((color) => ({
                        label: color,
                        value: color,
                      }))}
                    />
                  </Form.Item>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    aria-label="Remove colour"
                    onClick={() => remove(field.name)}
                  />
                </div>
              )})}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add("")}
                className="add-colour-btn"
              >
                Add Colour
              </Button>
            </Space>
          )}
        </Form.List>
      </Form.Item>
    </Card>
  );
};

export default React.memo(PrintingSection);
