import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosInstance";
import "./schedule.css";
import ChatBotIcon from "./ChatBotIcon";

const Schedule = () => {
  const { user } = useContext(AuthContext);
  const [medications, setMedications] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "daily",
    times: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null); // ✅ Track editing medication

  // Calendar state
  const [calendarLinked, setCalendarLinked] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);

  // Detect OAuth success from redirect (?linked=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("linked") === "true") {
      setCalendarLinked(true);
      setShowOAuthModal(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("linked");
      window.history.replaceState({}, document.title, url.pathname);
    }
  }, []);

  // Check if calendar is linked
  useEffect(() => {
    const checkLinked = async () => {
      try {
        const res = await fetch("http://localhost:8000/check-calendar");
        const data = await res.json();
        setCalendarLinked(data.linked);
      } catch (err) {
        console.log("Calendar check failed", err);
      }
    };
    checkLinked();
  }, []);

  // Link / Unlink calendar
  const handleLinkCalendar = () => window.location.href = "http://localhost:8000/auth";
  const handleUnlinkCalendar = async () => {
    if (!window.confirm("Are you sure you want to unlink your Google Calendar?")) return;
    try {
      const res = await fetch("http://localhost:8000/unlink-calendar", { method: "POST" });
      if (!res.ok) throw new Error("Unlink failed");
      setCalendarLinked(false);
      alert("Calendar unlinked successfully!");
    } catch (err) {
      console.error("Unlink error:", err);
      alert("Failed to unlink calendar.");
    }
  };
  const closeOAuthModal = () => setShowOAuthModal(false);

  // Fetch medications
  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const res = await api.get("/medications");
        setMedications(res.data.data || []);
      } catch (err) {
        console.error("Error fetching medications:", err);
      }
    };
    fetchMeds();
  }, []);

  // Handle input change
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // Add or Update medication
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const timesArray = formData.times.split(",").map(t => t.trim()).filter(t => t);

      let res;
      if (editId) {
        // ✅ Update medication
        res = await api.put(`/medications/${editId}`, {
          ...formData,
          times: timesArray,
          user: user._id,
          userEmail: user.email
        });
        setMedications(prev => prev.map(m => m._id === editId ? res.data.data : m));
        alert("✅ Medication updated successfully!");
      } else {
        // ✅ Add new medication
        res = await api.post("/medications", {
          ...formData,
          times: timesArray,
          user: user._id,
          userEmail: user.email
        });
        setMedications(prev => [...prev, res.data.data]);
        alert("✅ Medication added successfully!");
      }

      // Reset form
      setFormData({ name: "", dosage: "", frequency: "daily", times: "", startDate: "", endDate: "" });
      setEditId(null);
    } catch (err) {
      console.error("Error adding/updating medication:", err);
      alert("❌ Failed to add/update medication");
    } finally {
      setLoading(false);
    }
  };

  // Delete medication
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this medication?")) return;
    try {
      const res = await api.delete(`/medications/${id}`);
      if (res.data.success) {
        setMedications(prev => prev.filter(m => m._id !== id));
        alert("🗑️ Medication deleted");
      } else alert(`❌ Failed to delete: ${res.data.message}`);
    } catch (err) {
      console.error("Error deleting medication:", err);
      alert("❌ Failed to delete medication");
    }
  };

  // Edit medication (populate form)
  const handleEdit = (med) => {
    setFormData({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      times: Array.isArray(med.times) ? med.times.join(", ") : med.times,
      startDate: med.startDate?.split("T")[0] || "",
      endDate: med.endDate?.split("T")[0] || ""
    });
    setEditId(med._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container py-5">
      <h1 className="main-title text-center mb-4">
        <i className="bi bi-capsule"></i> Medicine Schedule Management
      </h1>

      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold"><i className="bi bi-clock-history"></i> Active Medicines</h2>
        <div className="header-actions d-flex align-items-center gap-2">
          {calendarLinked ? (
            <>
              <span className="linked"><i className="bi bi-calendar-check-fill"></i> Calendar Linked</span>
              <button className="btn btn-danger" onClick={handleUnlinkCalendar}>Unlink Calendar</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleLinkCalendar}><i className="bi bi-calendar-check"></i> Link Calendar</button>
          )}
        </div>
      </div>

      <div className="card p-4 mb-5 shadow-sm" id="medicine-form">
        <h4 className="fw-bold mb-3">{editId ? "Edit Medicine" : "Add Medicine"}</h4>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <input type="text" name="name" placeholder="Medicine Name" className="form-control" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="dosage" placeholder="Dosage" className="form-control" value={formData.dosage} onChange={handleChange} required />
            </div>
            <div className="col-md-4">
              <select name="frequency" className="form-select" value={formData.frequency} onChange={handleChange}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="col-md-8">
              <input type="text" name="times" className="form-control" placeholder="Times (e.g. 08:00, 20:00)" value={formData.times} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <input type="date" name="startDate" className="form-control" value={formData.startDate} onChange={handleChange} required />
            </div>
            <div className="col-md-6">
              <input type="date" name="endDate" className="form-control" value={formData.endDate} onChange={handleChange} />
            </div>
            <div className="col-12 text-end">
              <button type="submit" className="btn btn-success" disabled={loading}>{loading ? "Saving..." : editId ? "Update Medicine" : "Save Medicine"}</button>
            </div>
          </div>
        </form>
      </div>

      <div className="row g-4">
        {medications.length === 0 ? (
          <p className="text-center text-muted">No medications yet.</p>
        ) : (
          medications.map(med => (
            <div className="col-md-6 col-lg-4" key={med._id}>
              <div className="medicine-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span>{med.name}</span>
                  <div>
                    <button onClick={() => handleEdit(med)} className="btn btn-sm btn-primary me-2"><i className="bi bi-pencil"></i></button>
                    <button onClick={() => handleDelete(med._id)} className="btn btn-sm btn-danger"><i className="bi bi-trash"></i></button>
                  </div>
                </div>
                <div className="card-body">
                  <p><strong>Dosage:</strong> {med.dosage}</p>
                  <p><strong>Frequency:</strong> {med.frequency}</p>
                  <p><strong>Times:</strong> {Array.isArray(med.times) ? med.times.join(", ") : med.times}</p>
                  <p><strong>Start Date:</strong> {new Date(med.startDate).toLocaleDateString()}</p>
                  {med.endDate && <p><strong>End Date:</strong> {new Date(med.endDate).toLocaleDateString()}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showOAuthModal && (
        <div className="modal" style={{ display: "flex" }}>
          <div className="modal-content">
            <h4>✅ Google Calendar Linked Successfully!</h4>
            <button className="btn btn-success" onClick={closeOAuthModal}>OK</button>
          </div>
        </div>
      )}
      <div><ChatBotIcon /></div>
    </div>
  );
};

export default Schedule;
