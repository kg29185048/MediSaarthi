import React, { useState } from 'react';
import "./report.css"

const Reports = () => {
  const [activeReport, setActiveReport] = useState('weekly');

  const getReportContent = () => {
    switch (activeReport) {
      case 'weekly':
        return { 
          title: "Weekly Adherence Report (85%)", 
          icon: "bi-trophy-fill text-warning", 
          text: "Excellent adherence this week! Keep up the great work.", 
          textClass: "text-success fw-semibold" 
        };
      case 'monthly':
        return { 
          title: "Monthly Performance Summary (88%)", 
          icon: "bi-bar-chart-fill text-primary", 
          text: "Your overall performance is stable and above target.", 
          textClass: "text-primary fw-semibold" 
        };
      case 'history':
        return { 
          title: "Complete Adherence History", 
          icon: "bi-journal-text text-success", 
          text: "All recorded events are available here. Filter by date or medication.", 
          textClass: "text-muted" 
        };
      default:
        // Default case for safety
        return { 
          title: "Weekly Adherence Report (85%)", 
          icon: "bi-trophy-fill text-warning", 
          text: "Excellent adherence this week! Keep up the great work.", 
          textClass: "text-success fw-semibold" 
        };
    }
  };


  const currentReport = getReportContent();

  const getButtonClass = (buttonId) => {
    let baseClass = 'btn';
    
    if (activeReport === buttonId) {
        return `${baseClass} btn-primary`;
    }

    if (buttonId === 'history') {
        return `${baseClass} btn-outline-secondary`;
    } 
    
    return `${baseClass} btn-outline-primary`;
  };

  return (
    <div className="container py-4 pt-5">
      <div className="text-center">
        <h1 className="main-title">Adherence Reports and History</h1>
      </div>

      <div className="btn-group-custom">
        <button
          className={getButtonClass('weekly')}
          onClick={() => setActiveReport('weekly')}
          id="weeklyBtn"
        >
          <i className="bi bi-calendar-week me-1"></i> Weekly Report
        </button>
        <button
          className={getButtonClass('monthly')}
          onClick={() => setActiveReport('monthly')}
          id="monthlyBtn"
        >
          <i className="bi bi-calendar-month me-1"></i> Monthly Performance
        </button>
        <button
          className={getButtonClass('history')}
          onClick={() => setActiveReport('history')}
          id="historyBtn"
        >
          <i className="bi bi-clock-history me-1"></i> View All History
        </button>
      </div>

      <div className="content-area" id="contentArea">
        <h2>
          <i className={`bi ${currentReport.icon} me-2`}></i> {currentReport.title}
        </h2>
        <p className={currentReport.textClass}>{currentReport.text}</p>
      </div>
    </div>
  );
};

export default Reports;