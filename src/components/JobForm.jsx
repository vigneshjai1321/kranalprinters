import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
} from "antd";
import {
  BgColorsOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DeploymentUnitOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  PrinterOutlined,
  ScissorOutlined,
  SettingOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import BoxDiagramPreview from "./BoxDiagramPreview.jsx";
import { getJobDesignImage } from "../utils/jobDesign";
import { downloadJobPdf, generateJobPdfBlob } from "../utils/pdf";

const { Text } = Typography;

const machineOptions = ["6C", "5C", "2C", "MOE", "BK"];
const specialInstructionOptions = [
  "Old Film Plate",
  "Old CTP Plate",
  "Proof Checked",
  "Old Printed Sheet",
  "Without Batch No",
  "With Batch No",
  "New Film Plate",
  "New CTP Plate",
  "Job Approved Sheet",
  "Ref Colour Printout",
  "Ref Shade Card",
  "UPS",
];
const printingTypeOptions = ["MET-PET", "CMYK", "Pan colours"];
const printingTypeDisplayOptions = printingTypeOptions.map((value, index) => ({
  value,
  label: index < printingTypeOptions.length - 1 ? `${value},` : value,
}));
const colourNameOptions = [
  "PAN Blue 82774",
  "PAN Red 46129",
  "PAN Green 59382",
  "PAN Yellow 77421",
  "PAN Orange 68215",
  "PAN Purple 91564",
  "PAN Teal 34872",
  "PAN Grey 55691",
  "PAN Black 10294",
  "PAN White 88931",
  "Cyan",
  "Magenta",
  "Yellow",
  "Black",
];
const finishingMainOptions = ["Lamination", "Varnish", "Spot Varnish"];
const uvOptions = ["Spot UV", "Full UV", "Drip-Off"];
const conversionOptions = ["Gumming", "Punching", "Cutting"];
const processOptions = ["Lamination", "UV", "Foiling", "Embossing", "Die Cutting", "Pasting", "Folding"];

function normalizeUploadEvent(event) {
  if (Array.isArray(event)) return event;
  return event?.fileList || [];
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function ensureUploadFileList(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((file, index) => {
      if (!file || typeof file !== "object") return null;

      return {
        uid: file.uid || `upload-${index}`,
        name: file.name || `file-${index + 1}`,
        status: file.status || "done",
        url: file.url,
        originFileObj: file.originFileObj,
      };
    })
    .filter(Boolean);
}

const modeInfo = {
  create: {
    title: "Create New Job",
    type: "info",
    note: "Fill all required job details and save the docket.",
  },
  edit: {
    title: "Edit Job",
    type: "warning",
    note: "Editing existing job record. Job number is locked.",
  },
  duplicate: {
    title: "Duplicate Job",
    type: "success",
    note: "Copied from existing job with a new job number.",
  },
  view: {
    title: "View Job",
    type: "info",
    note: "Read-only view of job details.",
  },
};

function getDefaultValues(suggestedJobNo) {
  return {
    job_no: suggestedJobNo,
    date: dayjs(),
    job_mode: "New",
    printing_type: ["CMYK"],
    special_instructions: [],
    finishing_main: [],
    uv_finish: [],
    conversion_finish: [],
    processes: [],
    approval_status: "Approved",
  };
}

function mergeColours(colours = [], panColour) {
  const merged = [...(Array.isArray(colours) ? colours : []), panColour]
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return Array.from(new Set(merged));
}

function fillFromPreviousJob(form, previousJob, setLayoutJson) {
  if (!previousJob) {
    setLayoutJson(null);
    return;
  }

  form.setFieldsValue({
    customer_name: previousJob.customer_name,
    customer_location: previousJob.customer_location,
    job_no: previousJob.job_no,
    job_name: previousJob.job_name,
    job_type: previousJob.job_type,
    machine: previousJob.machine,
    paper_board: previousJob.paper_board,
    size_l: previousJob.size_l,
    size_b: previousJob.size_b,
    size_h: previousJob.size_h,
    cutting_size: previousJob.cutting_size,
    special_instructions: previousJob.special_instructions || [],
    printing_type: previousJob.printing_type || [],
    pan_colours: previousJob.pan_colours,
    color_count: previousJob.color_count,
    colours: mergeColours(previousJob.colours, previousJob.pan_colours),
    cylinder_ready: previousJob.cylinder_ready,
    border_waste_mm: previousJob.border_waste_mm,
    finishing_main: previousJob.finishing_main || [],
    uv_finish: previousJob.uv_finish || [],
    conversion_finish: previousJob.conversion_finish || [],
    folding_size: previousJob.folding_size,
    die_size: previousJob.die_size,
    die_type: previousJob.die_type,
    pasting_type: previousJob.pasting_type,
    processes: previousJob.processes || [],
    instructions: previousJob.instructions,
    approval_status: previousJob.approval_status || "Approved",
    approval_reason: previousJob.approval_reason || "",
  });
  setLayoutJson(previousJob.layout_json || null);
}

function clearForNewJob(form, suggestedJobNo, keepCustomer = true, setLayoutJson) {
  form.setFieldsValue({
    previous_job: undefined,
    job_no: suggestedJobNo,
    date: dayjs(),
    customer_name: keepCustomer ? form.getFieldValue("customer_name") : undefined,
    customer_location: keepCustomer ? form.getFieldValue("customer_location") : undefined,
    job_name: undefined,
    job_type: undefined,
    machine: undefined,
    paper_board: undefined,
    size_l: undefined,
    size_b: undefined,
    size_h: undefined,
    cutting_size: undefined,
    special_instructions: [],
    printing_type: ["CMYK"],
    pan_colours: undefined,
    color_count: undefined,
    colours: [],
    cylinder_ready: undefined,
    border_waste_mm: undefined,
    finishing_main: [],
    uv_finish: [],
    conversion_finish: [],
    folding_size: undefined,
    die_size: undefined,
    die_type: undefined,
    pasting_type: undefined,
    processes: [],
    instructions: undefined,
    approval_status: "Approved",
    approval_reason: undefined,
  });
  setLayoutJson(null);
}

function mapInitialData(data, suggestedJobNo, mode) {
  if (!data) return getDefaultValues(suggestedJobNo);

  const normalizedData = {
    ...data,
    date: data.date && dayjs(data.date).isValid() ? dayjs(data.date) : dayjs(),
    printing_type: ensureArray(data.printing_type),
    special_instructions: ensureArray(data.special_instructions),
    finishing_main: ensureArray(data.finishing_main),
    uv_finish: ensureArray(data.uv_finish),
    conversion_finish: ensureArray(data.conversion_finish),
    processes: ensureArray(data.processes),
    colours: mergeColours(ensureArray(data.colours), data.pan_colours),
    upload_design: ensureUploadFileList(data.upload_design),
  };

  if (mode === "duplicate") {
    return {
      ...getDefaultValues(suggestedJobNo),
      ...normalizedData,
      date: dayjs(),
      job_no: suggestedJobNo,
      job_mode: "New",
      approval_status: "Pending",
      approval_reason: "",
    };
  }

  return {
    ...getDefaultValues(suggestedJobNo),
    ...normalizedData,
    job_mode: "Old",
  };
}

function renderTags(values, color = "blue") {
  if (!values || values.length === 0) return <Text type="secondary">None selected</Text>;

  return (
    <Space wrap size={[6, 6]}>
      {values.map((item) => (
        <Tag color={color} key={item}>{item}</Tag>
      ))}
    </Space>
  );
}

function areJsonEqual(left, right) {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

export default function JobForm({
  customers = [],
  customerLocations = {},
  jobs = [],
  suggestedJobNo,
  mode = "create",
  initialData = null,
  onSubmit = () => {},
  onCancel = () => {},
  onAddCustomer,
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [showCustomerCreator, setShowCustomerCreator] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [customerLocationInput, setCustomerLocationInput] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [layoutJson, setLayoutJson] = useState(null);

  // Use useCallback to stabilize the callback reference
  const handleLayoutChange = useCallback(
    (nextLayout) => {
      setLayoutJson((prevLayout) => (areJsonEqual(prevLayout, nextLayout) ? prevLayout : nextLayout));
    },
    []
  );

  const isEdit = mode === "edit";
  const isDuplicate = mode === "duplicate";
  const isReadOnly = mode === "view";

  const selectedCustomer = Form.useWatch("customer_name", form);
  const previousJobId = Form.useWatch("previous_job", form);
  const jobMode = Form.useWatch("job_mode", form);
  const approvalStatus = Form.useWatch("approval_status", form);
  const sizeL = Form.useWatch("size_l", form);
  const sizeB = Form.useWatch("size_b", form);
  const sizeH = Form.useWatch("size_h", form);
  const cuttingSize = Form.useWatch("cutting_size", form);

  const jobNo = Form.useWatch("job_no", form);
  const jobName = Form.useWatch("job_name", form);
  const quantity = Form.useWatch("quantity", form);
  const machine = Form.useWatch("machine", form);
  const paperBoard = Form.useWatch("paper_board", form);
  const printingType = Form.useWatch("printing_type", form);
  const finishingMain = Form.useWatch("finishing_main", form);
  const processes = Form.useWatch("processes", form);
  const specialInstructions = Form.useWatch("special_instructions", form);

  const previousJobs = useMemo(() => {
    if (!selectedCustomer) return [];
    return jobs.filter((job) => job.customer_name === selectedCustomer);
  }, [jobs, selectedCustomer]);

  const selectedPreviousJob = useMemo(
    () => jobs.find((job) => String(job.id) === String(previousJobId)) || null,
    [jobs, previousJobId]
  );

  const designSourceJob = initialData || selectedPreviousJob || jobs[0] || null;
  const designImage = designSourceJob ? getJobDesignImage(designSourceJob) : "";

  useEffect(() => {
    const initialValues = mapInitialData(initialData, suggestedJobNo, mode);
    form.setFieldsValue(initialValues);
    setLayoutJson(initialValues.layout_json || null);
  }, [form, initialData, suggestedJobNo, mode]);

  const handleCustomerChange = (customer) => {
    const location = customerLocations[customer] || "";
    form.setFieldsValue({ customer_location: location, previous_job: undefined });
  };

  const handleJobModeChange = (value) => {
    if (value === "New") {
      clearForNewJob(form, suggestedJobNo, true, setLayoutJson);
      return;
    }

    form.setFieldsValue({ previous_job: undefined });
  };

  const handlePreviousJob = (jobId) => {
    const previousJob = jobs.find((job) => String(job.id) === String(jobId));
    fillFromPreviousJob(form, previousJob, setLayoutJson);
  };

  const handleFinish = (values) => {
    const sizeText = `${values.size_l || "-"} x ${values.size_b || "-"} x ${values.size_h || "-"} in`;
    const cleanColours = Array.from(
      new Set((values.colours || []).map((item) => String(item || "").trim()).filter(Boolean))
    );
    const firstPanColour = cleanColours.find((item) => item.toUpperCase().startsWith("PAN")) || "";

    const approval = isDuplicate ? "Pending" : values.approval_status;

    const payload = {
      ...values,
      colours: cleanColours,
      pan_colours: firstPanColour,
      id: isEdit ? initialData.id : Date.now(),
      date: dayjs(values.date).format("YYYY-MM-DD"),
      size: sizeText,
      quantity: Number(values.quantity),
      approval_status: approval,
      status: approval === "Approved" ? "In Progress" : "Pending",
      duplicated_from: isDuplicate ? initialData?.job_no : null,
      created_at: isEdit ? initialData.created_at : new Date().toISOString().slice(0, 10),
      layout_json: layoutJson,
    };

    onSubmit(payload);
  };

  const handleAddCustomer = async () => {
    if (!onAddCustomer) return;

    const customerName = customerNameInput.trim();
    const customerLocation = customerLocationInput.trim();

    if (!customerName || !customerLocation) {
      message.warning("Enter customer name and location");
      return;
    }

    setAddingCustomer(true);
    try {
      const result = await Promise.resolve(onAddCustomer({ customerName, customerLocation }));

      if (result?.ok) {
        form.setFieldsValue({
          customer_name: result.name,
          customer_location: result.location,
          previous_job: undefined,
        });
        setCustomerNameInput("");
        setCustomerLocationInput("");
        setShowCustomerCreator(false);
        message.success(`Customer added: ${result.name}`);
        return;
      }

      if (result?.reason === "exists") {
        form.setFieldsValue({
          customer_name: result.name,
          customer_location: result.location,
          previous_job: undefined,
        });
        message.info(`Customer already exists: ${result.name}`);
        return;
      }

      message.error("Could not add customer");
    } finally {
      setAddingCustomer(false);
    }
  };

  const getPdfSnapshot = () => {
    const values = form.getFieldsValue(true);
    const sizeText = `${values.size_l || "-"} x ${values.size_b || "-"} x ${values.size_h || "-"} in`;
    const cleanColours = Array.from(
      new Set((values.colours || []).map((item) => String(item || "").trim()).filter(Boolean))
    );
    const firstPanColour = cleanColours.find((item) => item.toUpperCase().startsWith("PAN")) || "";
    const approval = isDuplicate ? "Pending" : (values.approval_status || "Pending");

    return {
      ...initialData,
      ...values,
      size: sizeText,
      colours: cleanColours,
      pan_colours: firstPanColour,
      quantity: Number(values.quantity || 0),
      date: values.date ? dayjs(values.date).format("YYYY-MM-DD") : (initialData?.date || "-"),
      status: approval === "Approved" ? "In Progress" : "Pending",
      approval_status: approval,
      customer_location: values.customer_location || customerLocations[values.customer_name] || "-",
      job_no: values.job_no || suggestedJobNo,
      layout_json: layoutJson,
    };
  };

  const handleDownloadPdf = () => {
    const snapshot = getPdfSnapshot();
    downloadJobPdf(snapshot);
    message.success("PDF downloaded");
  };

  const handlePreviewPdf = () => {
    const snapshot = getPdfSnapshot();
    const blob = generateJobPdfBlob(snapshot);
    const url = URL.createObjectURL(blob);

    setPdfPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setPdfPreviewOpen(true);
  };

  const closePdfPreview = () => {
    setPdfPreviewOpen(false);
  };

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} className="job-form-layout" disabled={isReadOnly}>
      <Alert
        type={modeInfo[mode].type}
        showIcon
        message={modeInfo[mode].title}
        description={
          <Space direction="vertical" size={2}>
            <Text>{modeInfo[mode].note}</Text>
            {isEdit && <Text strong>Editing Job: {initialData?.job_no}</Text>}
            {isDuplicate && <Text strong>Duplicated from {initialData?.job_no}</Text>}
            {initialData?.last_updated_at && isEdit && (
              <Text type="secondary">Last updated on {new Date(initialData.last_updated_at).toLocaleString()}</Text>
            )}
          </Space>
        }
        style={{ marginBottom: 14 }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Card title={<Space><FileTextOutlined /> Job Details</Space>} className="form-section-card">
              <Row gutter={16}>
                <Col xs={24} md={6}>
                  <Form.Item label="Job Card Number" name="job_no" rules={[{ required: true, message: "Enter job number" }]}>
                    <Input placeholder="e.g., JOB010" disabled={isEdit} />
                  </Form.Item>
                  {!isEdit && <Text type="secondary">Auto-generated, editable for new jobs.</Text>}
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item label="Quantity" name="quantity" rules={[{ required: true, message: "Enter quantity" }]}>
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

            <Card title={<Space><InfoCircleOutlined /> Special Instructions</Space>} className="form-section-card">
              <Form.Item name="special_instructions" style={{ marginBottom: 0 }}>
                <Checkbox.Group options={specialInstructionOptions} className="job-check-grid job-check-grid-3" />
              </Form.Item>
            </Card>

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

              <Row gutter={16}>
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
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Upload Design"
                    name="upload_design"
                    valuePropName="fileList"
                    getValueFromEvent={normalizeUploadEvent}
                  >
                    <Upload beforeUpload={() => false} maxCount={1}>
                      <Button icon={<UploadOutlined />}>Upload File</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title={<Space><CheckCircleOutlined /> Approval</Space>} className="form-section-card">
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item label="Status" name="approval_status">
                    <Radio.Group disabled={isDuplicate} className="job-radio-inline">
                      <Radio value="Approved">Approved</Radio>
                      <Radio value="Pending">Pending</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                  {approvalStatus === "Pending" && (
                    <Form.Item
                      label="Reason"
                      name="approval_reason"
                      rules={[{ required: true, message: "Please add pending reason" }]}
                    >
                      <Input.TextArea rows={3} placeholder="Enter reason for pending status" />
                    </Form.Item>
                  )}
                </Col>
              </Row>

              <Form.Item label="General Instructions" name="instructions" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={3} placeholder="Add production notes" />
              </Form.Item>
            </Card>
          </Space>
        </Col>

        <Col xs={24} xl={8}>
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
        </Col>
      </Row>

      <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }}>
        <Button icon={<FolderOpenOutlined />} onClick={onCancel}>{isReadOnly ? "Close" : "Cancel"}</Button>
        {!isReadOnly ? (
          <Button type="primary" htmlType="submit">{isEdit ? "Update Job" : "Create Job"}</Button>
        ) : null}
      </Space>

      <Modal
        title="PDF Preview"
        open={pdfPreviewOpen}
        onCancel={closePdfPreview}
        width="min(1100px, calc(100vw - 20px))"
        destroyOnHidden
        className="pdf-preview-modal"
        footer={
          <Space>
            <Button onClick={closePdfPreview}>Close</Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPdf}>
              Download PDF
            </Button>
          </Space>
        }
      >
        <div className="pdf-preview-frame-wrap">
          {pdfPreviewUrl ? (
            <iframe
              src={pdfPreviewUrl}
              title="Job PDF Preview"
              className="pdf-preview-frame"
            />
          ) : (
            <Text type="secondary">PDF preview is not available.</Text>
          )}
        </div>
      </Modal>
    </Form>
  );
}
