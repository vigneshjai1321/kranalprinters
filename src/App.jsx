import { useEffect, useMemo, useState } from "react";
import { App as AntApp, Layout, Spin } from "antd";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import HeaderBar from "./components/HeaderBar.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Jobs from "./pages/Jobs.jsx";
import JobStatusBoard from "./pages/JobStatusBoard.jsx";
import { api } from "./services/api";

const { Content } = Layout;

function getNextJobNo(existingJobs) {
  const maxOrderNo = existingJobs.reduce((max, job) => {
    const token = String(job.job_no || "");
    const value = Number(token.replace(/[A-Z]+/, ""));
    return Number.isNaN(value) ? max : Math.max(max, value);
  }, 0);

  return `JOB${String(maxOrderNo + 1).padStart(3, "0")}`;
}

function getPageTitle(pathname) {
  if (pathname === "/") return "Home";
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/jobs") return "Jobs";
  if (pathname === "/kanban" || pathname === "/job-status-board") return "Job Status Board";
  return "Kranal Printer CRM";
}

function nowIso() {
  return new Date().toISOString();
}

export default function App() {
  const { message } = AntApp.useApp();
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerLocations, setCustomerLocations] = useState({});
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const data = await api.bootstrap();
        setJobs(data.jobs);
        setCustomers(data.customers);
        setCustomerLocations(data.customerLocations);
      } catch (error) {
        setJobs([]);
        setCustomers([]);
        setCustomerLocations({});
        message.error(error?.response?.data?.message || "Database not available. Could not load data.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [message]);

  const nextJobNo = useMemo(() => getNextJobNo(jobs), [jobs]);
  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);
  const activeMenuKey =
    location.pathname === "/kanban" || location.pathname === "/job-status-board"
      ? "/job-status-board"
      : location.pathname || "/";

  const handleCreateFromSidebar = () => {
    navigate("/jobs?create=1");
  };

  const handleCreateJob = async (job) => {
    const timestamp = nowIso();
    const historyNote = job.duplicated_from
      ? `Duplicated from ${job.duplicated_from} on ${new Date(timestamp).toLocaleString()}`
      : `Created on ${new Date(timestamp).toLocaleString()}`;

    const nextJob = {
      ...job,
      status: job.status || "Pending",
      approval_status: job.approval_status || "Pending",
      last_updated_at: timestamp,
      history: [historyNote],
    };

    const createdJob = await api.createJob(nextJob);
    setJobs((prev) => [createdJob, ...prev]);
  };

  const handleUpdateJob = async (updatedJob) => {
    const timestamp = nowIso();
    const currentJob = jobs.find((job) => job.id === updatedJob.id);
    const history = [...(currentJob?.history || []), `Edited on ${new Date(timestamp).toLocaleString()}`];
    const nextJob = {
      ...updatedJob,
      history,
      last_updated_at: timestamp,
    };

    const savedJob = await api.updateJob(nextJob);
    setJobs((prev) => prev.map((job) => (job.id === savedJob.id ? savedJob : job)));
  };

  const handleDeleteJob = async (jobId) => {
    await api.deleteJob(jobId);
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  const handleAddCustomer = async ({ customerName, customerLocation }) => {
    const name = String(customerName || "").trim().replace(/\s+/g, " ");
    const locationName = String(customerLocation || "").trim();

    if (!name || !locationName) {
      return { ok: false, reason: "missing" };
    }

    const result = await api.addCustomer({ customerName: name, customerLocation: locationName });

    if (result?.ok) {
      setCustomers((prev) => [...prev, result.name].sort((a, b) => a.localeCompare(b)));
      setCustomerLocations((prev) => ({ ...prev, [result.name]: result.location }));
      return result;
    }

    if (result?.reason === "exists") {
      return result;
    }

    return { ok: false, reason: "unknown" };
  };

  return (
    <Layout className="crm-layout">
      <Sidebar
        selectedKey={activeMenuKey}
        onNavigate={(path) => navigate(path)}
        onCreateJobClick={handleCreateFromSidebar}
      />

      <Layout className="crm-main-layout">
        <HeaderBar pageTitle={pageTitle} />
        <Content className="crm-content">
          <div className="app-shell">
            {loading ? (
              <div className="loader-wrap">
                <Spin size="large" />
              </div>
            ) : (
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard jobs={jobs} />} />
                <Route
                  path="/jobs"
                  element={
                    <Jobs
                      jobs={jobs}
                      customers={customers}
                      customerLocations={customerLocations}
                      nextJobNo={nextJobNo}
                      onCreateJob={handleCreateJob}
                      onUpdateJob={handleUpdateJob}
                      onDeleteJob={handleDeleteJob}
                      onAddCustomer={handleAddCustomer}
                    />
                  }
                />
                <Route
                  path="/job-status-board"
                  element={
                    <JobStatusBoard
                      jobs={jobs}
                      customers={customers}
                      customerLocations={customerLocations}
                      suggestedJobNo={nextJobNo}
                    />
                  }
                />
                <Route path="/kanban" element={<Navigate to="/job-status-board" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
