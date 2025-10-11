import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance.js";
import "./dashboard.css";
import { AuthContext } from "../context/AuthContext.js";
import { registerServiceWorkerAndSubscribe } from "../utils/pushNotifications.js";
import ChatBotIcon from "./ChatBotIcon.js";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [doses, setDoses] = useState([]);
  const [doseLogs, setDoseLogs] = useState([]);
  const [stats, setStats] = useState({ adherence: 0, taken: 0, missed: 0 });
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState({}); // Track logging per dose/time

  // Normalize date to YYYY-MM-DD
  const normalizeDate = (dateString) =>
    new Date(dateString).toISOString().split("T")[0];

  const fetchStats = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    const res = await api.get("/doselog/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStats(res.data.data || { adherence: 0, taken: 0, missed: 0 });
      } catch (err) {
        console.error("Error refreshing stats:", err);
      }
    };


  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const [medRes, logRes, statRes] = await Promise.all([
          api.get("/medications", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/doselog", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/doselog/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setDoses(medRes.data.data || []);
        setDoseLogs(logRes.data.data || []);
        setStats(statRes.data.data || { adherence: 0, taken: 0, missed: 0 });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    registerServiceWorkerAndSubscribe();
  }, []);

  // Helper: get dose status
  const getDoseStatus = (medId, time) => {
    const log = doseLogs.find(
      (l) =>
        String(l.medicationId) === String(medId) &&
        normalizeDate(l.date) === selectedDate &&
        l.time === time
    );
    return log ? log.status : null;
  };

  // Handle dose logging (Taken / Missed)
  const handleDoseLog = async (medicationId, time, newStatus) => {
    const key = `${medicationId}-${time}`;
    setLogging((prev) => ({ ...prev, [key]: true }));

    try {
      const token = localStorage.getItem("accessToken");

      // Check if log already exists
      const existingLog = doseLogs.find(
        (l) =>
          String(l.medicationId) === String(medicationId) &&
          normalizeDate(l.date) === selectedDate &&
          l.time === time
      );

      if (existingLog) {
        // Update existing
        await api.patch(
          `/doselog/${existingLog._id}`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setDoseLogs((prev) =>
          prev.map((l) =>
            l._id === existingLog._id ? { ...l, status: newStatus } : l
          )
        );
      } else {
        // Create new log
        const res = await api.post(
          "/doselog",
          { medicationId, date: selectedDate, time, status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDoseLogs((prev) => [...prev, res.data.data]);
      }
    await fetchStats();
    } catch (err) {
      console.error("Error logging dose:", err);
    } finally {
      setLogging((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Filter doses for selected date
  const filteredDoses = doses.filter((dose) => {
    const start = new Date(dose.startDate);
    const end = dose.endDate ? new Date(dose.endDate) : null;
    const selected = new Date(selectedDate);
    const inRange = end ? selected >= start && selected <= end : selected >= start;

    if (!inRange) return false;
    if (dose.frequency === "daily") return true;
    if (dose.frequency === "weekly") {
      const diffDays = Math.floor((selected - start) / (1000 * 60 * 60 * 24));
      return diffDays % 7 === 0;
    }
    return false;
  });

  const getButtonClass = (currentStatus, buttonType) => {
    if (currentStatus === buttonType) {
      return buttonType === "taken" ? "bg-success" : "bg-danger";
    }
    return "bg-secondary";
  };

  return (
    <div className="container py-4" id="dashboardContent">
      {/* Header */}
      <div className="dashboard-header d-flex justify-content-between align-items-center">
        <h1 className="h1">Hi, {user?.name || "User"}</h1>
        <div className="d-flex align-items-center gap-3">
          <input
            type="date"
            className="form-control"
            style={{ maxWidth: "200px" }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button className="btn btn-add" onClick={() => navigate("/app/schedule")}>
            <i className="bi bi-plus-circle me-1"></i> Add New Medicine
          </button>
        </div>
      </div>

      {/* Info banner (optional AI tip) */}
      <div className="info-banner">
        <i className="bi bi-lightning-charge-fill pulse me-2"></i>
        <strong>AI Prediction:</strong> You might miss your 6:00 PM dose today.
        <br />
        <small>Reminder scheduled for 5:30 PM — stay consistent!</small>
      </div>

      {/* Stats & Doses */}
      <div className="row g-4">
        {/* Weekly Stats */}
        <div className="col-md-4">
          <div className="card card-adherence text-center">
            <h5 className="card-title">
              <i className="bi bi-trophy-fill me-2"></i> Weekly Adherence
            </h5>
            <div className="adherence-score">{stats.adherence}%</div>
            <p className="mb-3">
              {stats.taken}/{stats.taken + stats.missed} doses taken
            </p>
            <button
              className="btn btn-link"
              onClick={() => navigate("/app/reports")}
            >
              <i className="bi bi-bar-chart-fill me-2"></i> View Detailed Report
            </button>
          </div>
        </div>
        {/* Doses List */}
        <div className="col-md-8">
          <div className="card card-doses">
            <h5>
              <i className="bi bi-calendar-event me-2 text-primary"></i> Doses for{" "}
              {selectedDate}
            </h5>

            {loading ? (
              <p className="text-muted">Loading your schedule...</p>
            ) : filteredDoses.length === 0 ? (
              <p className="text-muted mt-3">
                No medicines scheduled for this date.
              </p>
            ) : (
              filteredDoses.flatMap((dose) =>
                dose.times.map((time) => {
                  const doseStatus = getDoseStatus(dose._id, time);
                  const key = `${dose._id}-${time}`;

                  return (
                    <div
                      key={key}
                      className="dose-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>
                          {dose.name} ({dose.dosage})
                        </strong>
                        <br />
                        <span className="time text-muted">
                          <i className="bi bi-clock me-1"></i> {time}
                        </span>
                      </div>
                      <div className="dose-actions">
                        <button
                          type="button"
                          className={`badge ${getButtonClass(doseStatus, "taken")}`}
                          disabled={logging[key]}
                          onClick={() => handleDoseLog(dose._id, time, "taken")}
                        >
                          <i className="bi bi-check-circle me-1"></i> Taken
                        </button>

                        <button
                          type="button"
                          className={`badge ${getButtonClass(doseStatus, "missed")}`}
                          disabled={logging[key]}
                          onClick={() => handleDoseLog(dose._id, time, "missed")}
                        >
                          <i className="bi bi-x-circle me-1"></i> Missed
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
        <div><ChatBotIcon /></div>
      </div>
    </div>
  );
};

export default Dashboard;
