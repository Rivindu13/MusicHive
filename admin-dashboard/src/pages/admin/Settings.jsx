import { useState } from 'react';

const Settings = () => {
  // Mock state for toggles – later replace with API calls
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [userRegistration, setUserRegistration] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [reportThreshold, setReportThreshold] = useState(true);

  return (
    <div>
      <div className="mb-4">
        <h2>System Settings</h2>
        <p className="text-muted">Configure platform settings and preferences</p>
      </div>

      {/* General Settings */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>General Settings</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">Platform Maintenance Mode</label>
              <p className="text-muted small">Temporarily disable access for maintenance.</p>
            </div>
            <div className="col-md-6 d-flex align-items-center justify-content-md-end">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="maintenanceMode"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="maintenanceMode">
                  {maintenanceMode ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
          </div>
          <hr className="my-3" />
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">User Registration</label>
              <p className="text-muted small">Allow new users to register.</p>
            </div>
            <div className="col-md-6 d-flex align-items-center justify-content-md-end">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="userRegistration"
                  checked={userRegistration}
                  onChange={(e) => setUserRegistration(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="userRegistration">
                  {userRegistration ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
          </div>
          <hr className="my-3" />
          <div className="row">
            <div className="col-md-6">
              <label className="form-label fw-bold">Email Notifications</label>
              <p className="text-muted small">Send email notifications to users.</p>
            </div>
            <div className="col-md-6 d-flex align-items-center justify-content-md-end">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="emailNotifications"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="emailNotifications">
                  {emailNotifications ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Moderation */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>Content Moderation</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">Auto-approve Content</label>
              <p className="text-muted small">Automatically approve uploaded content.</p>
            </div>
            <div className="col-md-6 d-flex align-items-center justify-content-md-end">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="autoApprove"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="autoApprove">
                  {autoApprove ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
          </div>
          <hr className="my-3" />
          <div className="row">
            <div className="col-md-6">
              <label className="form-label fw-bold">Report Threshold</label>
              <p className="text-muted small">Auto-flag content after 3 reports.</p>
            </div>
            <div className="col-md-6 d-flex align-items-center justify-content-md-end">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="reportThreshold"
                  checked={reportThreshold}
                  onChange={(e) => setReportThreshold(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="reportThreshold">
                  {reportThreshold ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optional: Save button – could be added if needed */}
      {/* <div className="text-end">
        <button className="btn btn-primary">Save Changes</button>
      </div> */}
    </div>
  );
};

export default Settings;