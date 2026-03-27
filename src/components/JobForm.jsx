import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Space,
  Typography,
  Upload,
} from "antd";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getJobDesignImage } from "../utils/jobDesign";
import { downloadJobPdf, generateJobPdfBlob } from "../utils/pdf";

// Sub-components
import JobDetailsSection from "./form-sections/JobDetailsSection";
import CustomerSection from "./form-sections/CustomerSection";
import SizeCuttingSection from "./form-sections/SizeCuttingSection";
import PrintingSection from "./form-sections/PrintingSection";
import FinishingSection from "./form-sections/FinishingSection";
import SummaryPanel from "./form-sections/SummaryPanel";

const { Text } = Typography;

const specialInstructionOptions = [
  "Old Film Plate", "Old CTP Plate", "Proof Checked", "Old Printed Sheet", 
  "Without Batch No", "With Batch No", "New Film Plate", "New CTP Plate", 
  "Job Approved Sheet", "Ref Colour Printout", "Ref Shade Card", "UPS",
];

function normalizeUploadEvent(event) {
  if (Array.isArray(event)) return event;
  return event?.fileList || [];
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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
  create: { title: "Create New Job", type: "info", note: "Fill all required job details and save the docket." },
  edit: { title: "Edit Job", type: "warning", note: "Editing existing job record. Job number is locked." },
  duplicate: { title: "Duplicate Job", type: "success", note: "Copied from existing job with a new job number." },
  view: { title: "View Job", type: "info", note: "Read-only view of job details." },
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
  const customerName = keepCustomer ? form.getFieldValue("customer_name") : undefined;
  const customerLocation = keepCustomer ? form.getFieldValue("customer_location") : undefined;
  
  form.setFieldsValue({
    ...getDefaultValues(suggestedJobNo),
    customer_name: customerName,
    customer_location: customerLocation,
  });
  setLayoutJson(null);
}

function mapInitialData(data, suggestedJobNo, mode) {
  if (!data) return getDefaultValues(suggestedJobNo);

  const normalizedData = {
    ...data,
    date: data.date && dayjs(data.date).isValid() ? dayjs(data.date) : dayjs(),
    quantity: toOptionalNumber(data.quantity),
    size_l: toOptionalNumber(data.size_l),
    size_b: toOptionalNumber(data.size_b),
    size_h: toOptionalNumber(data.size_h),
    border_waste_mm: toOptionalNumber(data.border_waste_mm),
    color_count: toOptionalNumber(data.color_count),
    printing_type: ensureArray(data.printing_type),
    special_instructions: ensureArray(data.special_instructions),
    finishing_main: ensureArray(data.finishing_main),
    uv_finish: ensureArray(data.uv_finish),
    conversion_finish: ensureArray(data.conversion_finish),
    processes: ensureArray(data.processes),
    colours: mergeColours(ensureArray(data.colours), data.pan_colours),
    upload_design: ensureUploadFileList(data.upload_design),
    previous_job: undefined,
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

  const handleLayoutChange = useCallback((nextLayout) => {
    setLayoutJson((prevLayout) => (areJsonEqual(prevLayout, nextLayout) ? prevLayout : nextLayout));
  }, []);

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
    const cleanColours = Array.from(new Set((values.colours || []).map((i) => String(i || "").trim()).filter(Boolean)));
    const firstPanColour = cleanColours.find((i) => i.toUpperCase().startsWith("PAN")) || "";
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
    const name = customerNameInput.trim();
    const loc = customerLocationInput.trim();
    if (!name || !loc) {
      message.warning("Enter customer name and location");
      return;
    }
    setAddingCustomer(true);
    try {
      const result = await Promise.resolve(onAddCustomer({ customerName: name, customerLocation: loc }));
      if (result?.ok || result?.reason === "exists") {
        form.setFieldsValue({ customer_name: result.name, customer_location: result.location, previous_job: undefined });
        setCustomerNameInput("");
        setCustomerLocationInput("");
        setShowCustomerCreator(false);
        message.success(result.ok ? `Customer added: ${result.name}` : `Customer exists: ${result.name}`);
      } else {
        message.error("Could not add customer");
      }
    } finally {
      setAddingCustomer(false);
    }
  };

  const getPdfSnapshot = () => {
    const values = form.getFieldsValue(true);
    const sizeText = `${values.size_l || "-"} x ${values.size_b || "-"} x ${values.size_h || "-"} in`;
    const cleanColours = Array.from(new Set((values.colours || []).map((i) => String(i || "").trim()).filter(Boolean)));
    const firstPanColour = cleanColours.find((i) => i.toUpperCase().startsWith("PAN")) || "";
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
    downloadJobPdf(getPdfSnapshot());
    message.success("PDF downloaded");
  };

  const handlePreviewPdf = () => {
    const blob = generateJobPdfBlob(getPdfSnapshot());
    const url = URL.createObjectURL(blob);
    setPdfPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setPdfPreviewOpen(true);
  };

  const closePdfPreview = () => setPdfPreviewOpen(false);

  useEffect(() => {
    return () => { if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl); };
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
            <JobDetailsSection isEdit={isEdit} />

            <CustomerSection 
              isEdit={isEdit} isReadOnly={isReadOnly} isDuplicate={isDuplicate}
              customers={customers} customerLocations={customerLocations}
              selectedCustomer={selectedCustomer} jobMode={jobMode}
              previousJobs={previousJobs} showCustomerCreator={showCustomerCreator}
              setShowCustomerCreator={setShowCustomerCreator} customerNameInput={customerNameInput}
              setCustomerNameInput={setCustomerNameInput} customerLocationInput={customerLocationInput}
              setCustomerLocationInput={setCustomerLocationInput} addingCustomer={addingCustomer}
              handleAddCustomer={handleAddCustomer} handleCustomerChange={handleCustomerChange}
              handleJobModeChange={handleJobModeChange} handlePreviousJob={handlePreviousJob}
            />

            <SizeCuttingSection isEdit={isEdit} isReadOnly={isReadOnly} />

            <Card title={<Space><InfoCircleOutlined /> Special Instructions</Space>} className="form-section-card">
              <Form.Item name="special_instructions" style={{ marginBottom: 0 }}>
                <Checkbox.Group options={specialInstructionOptions} className="job-check-grid job-check-grid-3" />
              </Form.Item>
            </Card>

            <PrintingSection />
            <FinishingSection />

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
                      label="Reason" name="approval_reason"
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
            
            <Card title={<Space><UploadOutlined /> Production Design</Space>} className="form-section-card">
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
            </Card>
          </Space>
        </Col>

        <Col xs={24} xl={8}>
          <SummaryPanel 
            designImage={designImage} handlePreviewPdf={handlePreviewPdf}
            handleDownloadPdf={handleDownloadPdf} sizeL={sizeL}
            sizeB={sizeB} sizeH={sizeH} cuttingSize={cuttingSize}
            form={form} layoutJson={layoutJson} handleLayoutChange={handleLayoutChange}
            isReadOnly={isReadOnly} jobNo={jobNo} selectedCustomer={selectedCustomer}
            jobName={jobName} quantity={quantity} machine={machine}
            paperBoard={paperBoard} printingType={printingType}
            finishingMain={finishingMain} processes={processes}
            specialInstructions={specialInstructions}
          />
        </Col>
      </Row>

      <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }}>
        <Button icon={<FolderOpenOutlined />} onClick={onCancel}>{isReadOnly ? "Close" : "Cancel"}</Button>
        {!isReadOnly && <Button type="primary" htmlType="submit">{isEdit ? "Update Job" : "Create Job"}</Button>}
      </Space>

      <Modal
        title="PDF Preview" open={pdfPreviewOpen} onCancel={closePdfPreview}
        width="min(1100px, calc(100vw - 20px))" destroyOnHidden
        className="pdf-preview-modal"
        footer={<Space><Button onClick={closePdfPreview}>Close</Button><Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPdf}>Download PDF</Button></Space>}
      >
        <div className="pdf-preview-frame-wrap">
          {pdfPreviewUrl ? <iframe src={pdfPreviewUrl} title="Job PDF Preview" className="pdf-preview-frame" /> : <Text type="secondary">PDF preview is not available.</Text>}
        </div>
      </Modal>
    </Form>
  );
}
