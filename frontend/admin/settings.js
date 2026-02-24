window.loadSettings = async function() {
  try {
    const result = await window.api.getSettings();
    const settings = result.data;

    // Working Hours
    if (settings.workingHours) {
      document.getElementById("workStartTime").value =
        settings.workingHours.work_start_time || "09:00";
      document.getElementById("workEndTime").value =
        settings.workingHours.work_end_time || "17:00";
    }

    // Policies
    if (settings.policies) {
      document.getElementById("lateThreshold").value =
        settings.policies.late_threshold_minutes || 15;
      document.getElementById("halfDayHours").value =
        settings.policies.half_day_hours || 4;
      document.getElementById("fullDayHours").value =
        settings.policies.full_day_hours || 8;
    }

    // Notifications
    if (settings.notifications) {
      document.getElementById("notifyAbsent").checked =
        settings.notifications.notify_absent !== false;
      document.getElementById("notifyLate").checked =
        settings.notifications.notify_late !== false;
      document.getElementById("notifyLeave").checked =
        settings.notifications.notify_leave !== false;
    }

  } catch (error) {
    console.error("Error loading settings:", error);
  }
};

// Save Working Hours

document.querySelector(".settings-card:nth-child(1) .btn-save-settings")?.addEventListener("click", async function () {
  const work_start_time = document.getElementById("workStartTime").value;
  const work_end_time = document.getElementById("workEndTime").value;

  if (!work_start_time || !work_end_time) {
    alert("Please fill in both start and end times.");
    return;
  }

  if (work_start_time >= work_end_time) {
    alert("Work end time must be after start time.");
    return;
  }

  try {
    this.disabled = true;
    this.textContent = "Saving...";

    await window.api.updateWorkingHours({ work_start_time, work_end_time });
    alert("Working hours saved successfully!");
  } catch (error) {
    alert("Failed to save working hours: " + error.message);
  } finally {
    this.disabled = false;
    this.textContent = "Save Working Hours";
  }
});

// Save Attendance Policies
document.querySelector(".settings-card:nth-child(2) .btn-save-settings")?.addEventListener("click", async function () {
  const late_threshold_minutes = parseInt(document.getElementById("lateThreshold").value);
  const half_day_hours = parseFloat(document.getElementById("halfDayHours").value);
  const full_day_hours = parseFloat(document.getElementById("fullDayHours").value);

  if (isNaN(late_threshold_minutes) || isNaN(half_day_hours) || isNaN(full_day_hours)) {
    alert("Please enter valid numbers for all policy fields.");
    return;
  }

  if (half_day_hours >= full_day_hours) {
    alert("Full day hours must be greater than half day hours.");
    return;
  }

  try {
    this.disabled = true;
    this.textContent = "Saving...";

    await window.api.updatePolicies({
      late_threshold_minutes,
      half_day_hours,
      full_day_hours
    });

    alert("Attendance policies saved successfully!");
  } catch (error) {
    alert("Failed to save policies: " + error.message);
  } finally {
    this.disabled = false;
    this.textContent = "Save Policies";
  }
});

// =======================
// Save Notifications
// =======================
document.querySelector(".settings-card:nth-child(3) .btn-save-settings")?.addEventListener("click", async function () {
  const notify_absent = document.getElementById("notifyAbsent").checked;
  const notify_late = document.getElementById("notifyLate").checked;
  const notify_leave = document.getElementById("notifyLeave").checked;

  try {
    this.disabled = true;
    this.textContent = "Saving...";

    await window.api.updateNotifications({
      notify_absent,
      notify_late,
      notify_leave
    });

    alert("Notification settings saved successfully!");
  } catch (error) {
    alert("Failed to save notifications: " + error.message);
  } finally {
    this.disabled = false;
    this.textContent = "Save Notifications";
  }
});

// =======================
// Export Attendance Data
// =======================
document.querySelector(".settings-card:nth-child(4) .btn-export-data:first-child")?.addEventListener("click", async () => {
  try {
    const response = await window.api.exportAttendance();

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `attendance_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    alert("Attendance data exported successfully!");
  } catch (error) {
    console.error("Export error:", error);
    alert("Failed to export attendance: " + error.message);
  }
});
