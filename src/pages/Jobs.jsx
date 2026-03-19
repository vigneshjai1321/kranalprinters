import { App, Button, Card, Dropdown, Input, Modal, Select, Space, Table, Tag, Typography } from "antd";
import { CopyOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, FilterOutlined, MenuOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import JobForm from "../components/JobForm.jsx";
import { downloadJobPdf } from "../utils/pdf";

const { Title, Text } = Typography;

const statusColors = {
  Pending: "red",
  "In Progress": "orange",
  Completed: "green",
};

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function normalizeUploadList(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((file, index) => {
      if (!file || typeof file !== "object") return null;

      return {
        uid: file.uid || `upload-${index}`,
        name: file.name || `file-${index + 1}`,
        status: file.status || "done",
        url: file.url,
      };
    })
    .filter(Boolean);
}

function normalizeJobForEditor(record) {
  if (!record || typeof record !== "object") return null;

  return {
    ...record,
    printing_type: toArray(record.printing_type),
    special_instructions: toArray(record.special_instructions),
    finishing_main: toArray(record.finishing_main),
    uv_finish: toArray(record.uv_finish),
    conversion_finish: toArray(record.conversion_finish),
    processes: toArray(record.processes),
    colours: toArray(record.colours),
    upload_design: normalizeUploadList(record.upload_design),
    layout_json:
      record.layout_json && typeof record.layout_json === "object"
        ? record.layout_json
        : null,
  };
}

export default function Jobs({
  jobs,
  customers,
  customerLocations,
  nextJobNo,
  onCreateJob,
  onUpdateJob,
  onDeleteJob,
  onAddCustomer,
}) {
  const { message, modal } = App.useApp();

  const [open, setOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [activeJob, setActiveJob] = useState(null);
  const [jobNoSearch, setJobNoSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  const location = useLocation();
  const navigate = useNavigate();
  const statusFilter = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status");
    return status || "";
  }, [location.search]);
  const customerFilter = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const customer = params.get("customer");
    return customer || "";
  }, [location.search]);
  const machineFilter = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const machine = params.get("machine");
    return machine || "";
  }, [location.search]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const byStatus = selectedStatus ? job.status === selectedStatus : true;
      const byCustomer = selectedCustomer ? job.customer_name === selectedCustomer : true;
      const byMachine = selectedMachine ? job.machine === selectedMachine : true;
      const byJobNo = jobNoSearch
        ? String(job.job_no || "").toLowerCase().includes(jobNoSearch.toLowerCase())
        : true;
      return byStatus && byCustomer && byMachine && byJobNo;
    });
  }, [jobs, selectedStatus, selectedCustomer, selectedMachine, jobNoSearch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("create") === "1") {
      setModalMode("create");
      setActiveJob(null);
      setOpen(true);
    }

    setSelectedStatus(statusFilter);
    setSelectedCustomer(customerFilter);
    setSelectedMachine(machineFilter);
    setJobNoSearch("");
    setTablePage(1);
  }, [location.search, statusFilter, customerFilter, machineFilter]);

  useEffect(() => {
    setTablePage(1);
  }, [jobNoSearch, selectedCustomer, selectedStatus, selectedMachine]);

  const closeModal = () => {
    setOpen(false);
    setActiveJob(null);
    setModalMode("create");

    const params = new URLSearchParams(location.search);
    if (params.get("create") === "1") {
      params.delete("create");
      const search = params.toString();
      navigate(`/jobs${search ? `?${search}` : ""}`, { replace: true });
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  const openEditModal = useCallback((record) => {
    setModalMode("edit");
    setActiveJob(normalizeJobForEditor(record));
    setOpen(true);
  }, []);

  const confirmDelete = useCallback((record) => {
    modal.confirm({
      title: "Delete this job?",
      content: `This will permanently remove ${record.job_no}.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        await onDeleteJob(record.id);
        message.success(`Deleted ${record.job_no}`);
      },
    });
  }, [message, modal, onDeleteJob]);

  const confirmDuplicate = useCallback((record) => {
    const newJobNo = nextJobNo;

    modal.confirm({
      title: "Duplicate this job?",
      content: (
        <div>
          <div>Source Job: <strong>{record.job_no}</strong></div>
          <div>New Job ID: <strong>{newJobNo}</strong></div>
        </div>
      ),
      okText: "Duplicate",
      onOk: async () => {
        const now = new Date().toISOString();
        const duplicatedJob = {
          ...record,
          id: Date.now(),
          job_no: newJobNo,
          date: now.slice(0, 10),
          status: "Pending",
          approval_status: "Pending",
          approval_reason: "",
          duplicated_from: record.job_no,
          created_at: now.slice(0, 10),
          last_updated_at: now,
          history: [],
        };
        await onCreateJob(duplicatedJob);
        message.success(`Duplicated ${record.job_no} as ${newJobNo}`);
      },
    });
  }, [message, modal, nextJobNo, onCreateJob]);

  const getRowActionItems = useCallback((record) => ([
    {
      key: `edit-${record.id}`,
      label: "Edit",
      icon: <EditOutlined />,
    },
    {
      key: `duplicate-${record.id}`,
      label: "Duplicate",
      icon: <CopyOutlined />,
    },
    {
      key: `delete-${record.id}`,
      label: "Delete",
      icon: <DeleteOutlined />,
      danger: true,
    },
    {
      type: "divider",
    },
    {
      key: `pdf-${record.id}`,
      label: "Download PDF",
      icon: <DownloadOutlined />,
    },
  ]), [confirmDelete, confirmDuplicate, openEditModal]);

  const handleRowMenuClick = useCallback((record, event) => {
    if (event.key.startsWith("edit-")) {
      openEditModal(record);
      return;
    }

    if (event.key.startsWith("duplicate-")) {
      confirmDuplicate(record);
      return;
    }

    if (event.key.startsWith("delete-")) {
      confirmDelete(record);
      return;
    }

    if (event.key.startsWith("pdf-")) {
      downloadJobPdf(record);
    }
  }, [confirmDelete, confirmDuplicate, openEditModal]);

  const handleRowClick = useCallback((record, event) => {
    if (event.defaultPrevented) return;

    const target = event.target;
    if (target instanceof Element) {
      const clickedInteractive = target.closest("button, a, input, .ant-dropdown-trigger");
      if (clickedInteractive) return;
    }

    openEditModal(record);
  }, [openEditModal]);

  const columns = useMemo(
    () => [
      {
        title: "",
        key: "actions",
        width: 70,
        render: (_, record) => (
            <Dropdown
              trigger={["click"]}
              menu={{
                items: getRowActionItems(record),
                onClick: (event) => handleRowMenuClick(record, event),
              }}
            >
              <Button
                type="text"
                icon={<MenuOutlined />}
                aria-label={`Actions for ${record.job_no}`}
                onClick={(event) => event.stopPropagation()}
              />
            </Dropdown>
        ),
      },
      { title: "Job No", dataIndex: "job_no", key: "job_no" },
      { title: "Customer", dataIndex: "customer_name", key: "customer_name" },
      { title: "Job Name", dataIndex: "job_name", key: "job_name" },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => <Tag color={statusColors[status] || "default"}>{status}</Tag>,
      },
      { title: "Quantity", dataIndex: "quantity", key: "quantity" },
      {
        title: "Last Updated",
        dataIndex: "last_updated_at",
        key: "last_updated_at",
        render: (value) => formatDateTime(value),
      },
    ],
    [getRowActionItems, handleRowMenuClick]
  );

  const modalTitle =
    modalMode === "edit"
      ? "Edit Job Docket"
      : modalMode === "duplicate"
      ? "Duplicate Job Docket"
      : "Create Job Docket";

  const formInstanceKey = `${modalMode}-${activeJob?.id ?? "new"}`;

  const hasQuickFilters = Boolean(
    statusFilter ||
      customerFilter ||
      machineFilter ||
      jobNoSearch ||
      selectedCustomer ||
      selectedStatus ||
      selectedMachine
  );

  return (
    <Card
      style={{ borderRadius: 14 }}
      title={<Title level={5} style={{ margin: 0 }}>All Jobs</Title>}
      extra={
        <Space>
          {statusFilter ? (
            <Tag color={statusColors[statusFilter] || "blue"} style={{ marginInlineEnd: 0 }}>
              {statusFilter}: {filteredJobs.length}
            </Tag>
          ) : null}
          {customerFilter ? (
            <Tag color="geekblue" style={{ marginInlineEnd: 0 }}>
              {customerFilter}
            </Tag>
          ) : null}
          {machineFilter ? (
            <Tag color="cyan" style={{ marginInlineEnd: 0 }}>
              Machine: {machineFilter}
            </Tag>
          ) : null}
          {statusFilter || customerFilter || machineFilter ? (
            <Button size="small" onClick={() => navigate("/jobs", { replace: true })}>
              Clear Filter
            </Button>
          ) : null}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setModalMode("create");
              setActiveJob(null);
              setOpen(true);
            }}
          >
            Create Job
          </Button>
        </Space>
      }
    >
      <div className="jobs-filter-shell">
        <div className="jobs-filter-head">
          <Space size={6}>
            <FilterOutlined />
            <Text strong>Filters</Text>
          </Space>
          <Tag color="blue" style={{ marginInlineEnd: 0 }}>
            {filteredJobs.length} Results
          </Tag>
        </div>

        <div className="jobs-filter-bar">
          <div className="jobs-filter-item">
            <Text className="jobs-filter-label">Job No</Text>
            <Input
              allowClear
              placeholder="Search Job No"
              value={jobNoSearch}
              prefix={<SearchOutlined />}
              onChange={(event) => setJobNoSearch(event.target.value)}
            />
          </div>
          <div className="jobs-filter-item">
            <Text className="jobs-filter-label">Customer</Text>
            <Select
              allowClear
              placeholder="All Customers"
              value={selectedCustomer || undefined}
              onChange={(value) => setSelectedCustomer(value || "")}
              options={customers.map((customer) => ({ label: customer, value: customer }))}
            />
          </div>
          <div className="jobs-filter-item">
            <Text className="jobs-filter-label">Status</Text>
            <Select
              allowClear
              placeholder="All Statuses"
              value={selectedStatus || undefined}
              onChange={(value) => setSelectedStatus(value || "")}
              options={Object.keys(statusColors).map((status) => ({ label: status, value: status }))}
            />
          </div>
          <div className="jobs-filter-item">
            <Text className="jobs-filter-label">Machine</Text>
            <Select
              allowClear
              placeholder="All Machines"
              value={selectedMachine || undefined}
              onChange={(value) => setSelectedMachine(value || "")}
              options={Array.from(new Set(jobs.map((job) => job.machine).filter(Boolean))).map((machine) => ({
                label: machine,
                value: machine,
              }))}
            />
          </div>
          <div className="jobs-filter-action">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setJobNoSearch("");
                setSelectedCustomer("");
                setSelectedStatus("");
                setSelectedMachine("");
                navigate("/jobs", { replace: true });
              }}
              disabled={!hasQuickFilters}
              block
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredJobs}
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: (event) => handleRowClick(record, event),
          style: { cursor: "pointer" },
        })}
        pagination={{
          current: tablePage,
          pageSize: tablePageSize,
          total: filteredJobs.length,
          onChange: (page, pageSize) => {
            setTablePage(page);
            setTablePageSize(pageSize);
          },
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total) => `Total ${total} jobs`,
        }}
      />

      <Modal
        title={modalTitle}
        open={open}
        onCancel={closeModal}
        width="min(1160px, calc(100vw - 24px))"
        footer={null}
        centered
        destroyOnHidden
        className="jobs-editor-modal"
      >
        <JobForm
          key={formInstanceKey}
          customers={customers}
          customerLocations={customerLocations}
          jobs={jobs}
          suggestedJobNo={nextJobNo}
          mode={modalMode}
          initialData={activeJob}
          onCancel={closeModal}
          onAddCustomer={onAddCustomer}
          onSubmit={async (payload) => {
            try {
              if (modalMode === "edit") {
                await onUpdateJob(payload);
                message.success("Job Updated Successfully");
              } else {
                await onCreateJob(payload);
                message.success("Job Created Successfully");
              }
              closeModal();
            } catch (error) {
              message.error(error?.response?.data?.message || "Could not save job");
            }
          }}
        />
      </Modal>
    </Card>
  );
}
