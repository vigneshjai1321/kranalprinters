import React from "react";
import { Button, Card, Space, Typography, Tag } from "antd";
import { DeploymentUnitOutlined, DownloadOutlined, EyeOutlined, PrinterOutlined } from "@ant-design/icons";
import BoxDiagramPreview from "../BoxDiagramPreview.jsx";

const { Text } = Typography;

const renderTags = (values, color = "blue") => {
  if (!values || values.length === 0) return <Text type="secondary">None selected</Text>;

  return (
    <Space wrap size={[6, 6]}>
      {values.map((item) => (
        <Tag color={color} key={item}>{item}</Tag>
      ))}
    </Space>
  );
};

const SummaryPanel = ({
  designImage,
  handlePreviewPdf,
  handleDownloadPdf,
  sizeL,
  sizeB,
  sizeH,
  cuttingSize,
  form,
  layoutJson,
  handleLayoutChange,
  isReadOnly,
  jobNo,
  selectedCustomer,
  jobName,
  quantity,
  machine,
  paperBoard,
  printingType,
  finishingMain,
  processes,
  specialInstructions,
}) => {
  return (
    <div className="job-form-right-panel">
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Card
          title={<Space><PrinterOutlined /> Previous Design Preview</Space>}
          className="form-section-card design-preview-card"
        >
          <div className="design-preview-wrap">
            {designImage ? (
              <img src={designImage} alt="Previous job design preview" className="design-preview-image" />
            ) : (
              <Text type="secondary">No design image available.</Text>
            )}
          </div>
          <Button
            icon={<EyeOutlined />}
            onClick={handlePreviewPdf}
            className="design-download-btn"
            block
          >
            Preview PDF
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadPdf}
            className="design-download-btn"
            block
          >
            Download PDF
          </Button>
        </Card>

        <BoxDiagramPreview
          length={sizeL}
          breadth={sizeB}
          height={sizeH}
          cuttingSize={cuttingSize}
          onLengthChange={(value) => form.setFieldsValue({ size_l: value })}
          onBreadthChange={(value) => form.setFieldsValue({ size_b: value })}
          onHeightChange={(value) => form.setFieldsValue({ size_h: value })}
          onCuttingSizeChange={(value) => form.setFieldsValue({ cutting_size: value })}
          initialLayout={layoutJson}
          onLayoutChange={handleLayoutChange}
          disabled={isReadOnly}
        />

        <Card title={<Space><DeploymentUnitOutlined /> Live Summary</Space>} className="form-section-card">
          <div className="job-summary-grid">
            <Text type="secondary">Job No</Text><Text strong>{jobNo || "-"}</Text>
            <Text type="secondary">Customer</Text><Text strong>{selectedCustomer || "-"}</Text>
            <Text type="secondary">Job Name</Text><Text strong>{jobName || "-"}</Text>
            <Text type="secondary">Quantity</Text><Text strong>{quantity || "-"}</Text>
            <Text type="secondary">Machine</Text><Text strong>{machine || "-"}</Text>
            <Text type="secondary">Paper</Text><Text strong>{paperBoard || "-"}</Text>
          </div>
        </Card>

        <Card title={<Space><PrinterOutlined /> Selections</Space>} className="form-section-card">
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <div>
              <Text strong>Printing</Text>
              <div>{renderTags(printingType, "geekblue")}</div>
            </div>
            <div>
              <Text strong>Finishing</Text>
              <div>{renderTags(finishingMain, "purple")}</div>
            </div>
            <div>
              <Text strong>Processes</Text>
              <div>{renderTags(processes, "cyan")}</div>
            </div>
            <div>
              <Text strong>Special Instructions</Text>
              <div>{renderTags(specialInstructions, "gold")}</div>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default React.memo(SummaryPanel);
