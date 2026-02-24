window.loadOverviewData = async function () {
  try {
    console.log("📊 Loading overview data...");

    const employeesResponse = await window.api.getUsers();
    console.log("Raw employees response:", employeesResponse);

    const employees = Array.isArray(employeesResponse?.data)
      ? employeesResponse.data
      : Array.isArray(employeesResponse)
      ? employeesResponse
      : [];

    console.log("Employees found:", employees.length);
    document.getElementById("totalEmployees").textContent = employees.length;

    const attendanceResponse = await window.api.getAttendance();
    console.log("Raw attendance response:", attendanceResponse);

    const records = Array.isArray(attendanceResponse?.data)
      ? attendanceResponse.data
      : Array.isArray(attendanceResponse)
      ? attendanceResponse
      : [];

    console.log("Attendance records found:", records.length);

    // Safety check
    if (!Array.isArray(records)) {
      console.error(" Attendance records is not an array:", records);
      return;
    }

    // Get today's date in local timezone (not UTC)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`; // YYYY-MM-DD format in local time
    
    console.log("📅 Today's date (local):", todayStr);
    console.log("📅 Sample record dates:", records.slice(0, 3).map(r => ({
      date: r.date,
      status: r.status,
      name: r.name
    })));

    // Filter for today's records (handle different date formats and timezones)
    const todayRecords = records.filter((r) => {
      if (!r?.date) return false;
      
      // Handle both Date objects and string dates
      let recordDate;
      if (typeof r.date === 'string') {
        // Parse the date string and convert to local date
        const dateObj = new Date(r.date);
        const recYear = dateObj.getFullYear();
        const recMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
        const recDay = String(dateObj.getDate()).padStart(2, '0');
        recordDate = `${recYear}-${recMonth}-${recDay}`;
      } else if (r.date instanceof Date) {
        const recYear = r.date.getFullYear();
        const recMonth = String(r.date.getMonth() + 1).padStart(2, '0');
        const recDay = String(r.date.getDate()).padStart(2, '0');
        recordDate = `${recYear}-${recMonth}-${recDay}`;
      } else {
        return false;
      }
      
      const matches = recordDate === todayStr;
      if (matches) {
        console.log(" Found today's record:", r.name, r.status);
      }
      return matches;
    });

    console.log(" Today's records found:", todayRecords.length);

        
    const presentCount = todayRecords.filter(
      (r) => r?.status?.toUpperCase() === "PRESENT"
    ).length;

    const absentCount = todayRecords.filter(
      (r) => r?.status?.toUpperCase() === "ABSENT"
    ).length;

    const leaveCount = todayRecords.filter((r) => {
      const status = r?.status?.toUpperCase() || "";
      return status === "LEAVE" || status === "ON-LEAVE" || status === "ON LEAVE";
    }).length;

    console.log("📊 Status counts:", { presentCount, absentCount, leaveCount });

  
    const totalEmployees = employees.length || 1; // Prevent division by zero

    const attendanceRate = totalEmployees > 0
      ? Math.round((presentCount / totalEmployees) * 100)
      : 0;

    const absentPercent = totalEmployees > 0
      ? Math.round((absentCount / totalEmployees) * 100)
      : 0;

    console.log("📊 Calculated rates:", { attendanceRate, absentPercent });

    
    document.getElementById("presentToday").textContent = presentCount;
    document.getElementById("absentToday").textContent = absentCount;
    document.getElementById("onLeaveToday").textContent = leaveCount;
    document.getElementById("attendanceRate").textContent = `${attendanceRate}% attendance rate`;
    document.getElementById("absentPercent").textContent = `${absentPercent}% of total`;

    console.log("Dashboard UI updated successfully!");

    // Load activity feed with today's records
    loadActivityFeed(todayRecords);

  } catch (error) {
    console.error(" Error loading overview data:", error);
    alert("Failed to load overview data: " + error.message);
  }
};

function loadActivityFeed(records = []) {
  const activityList = document.getElementById("activityList");
  if (!activityList) {
    console.warn("⚠️ Activity list element not found");
    return;
  }

  const today = new Date();
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const activityDate = document.getElementById("activityDate");
  if (activityDate) {
    activityDate.textContent = today.toLocaleDateString("en-US", dateOptions);
  }

  activityList.innerHTML = "";

  if (!Array.isArray(records) || records.length === 0) {
    console.log("ℹ️ No activity records to display");
    activityList.innerHTML = `
      <div class="activity-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <p>No activity recorded today</p>
      </div>
    `;
    return;
  }

  // Sort by check-in time (most recent first)
  const sortedRecords = [...records].sort((a, b) => {
    const timeA = a?.check_in || "00:00";
    const timeB = b?.check_in || "00:00";
    return timeB.localeCompare(timeA);
  });

  // Show only the latest 10 activities
  sortedRecords.slice(0, 10).forEach((record) => {
    const activityItem = document.createElement("div");
    const status = record?.status?.toLowerCase() || "check-in";
    activityItem.className = `activity-item ${status}`;

    let icon = "✓";
    let title = `${record?.name || "Employee"} checked in`;
    let time = record?.check_in || "";

    // Use case-insensitive comparison
    const statusUpper = record?.status?.toUpperCase() || "";
    
    if (statusUpper === "ABSENT") {
      title = `${record?.name || "Employee"} marked absent`;
    } else if (statusUpper.includes("LEAVE")) {
      title = `${record?.name || "Employee"} on leave`;
    } else if (record?.check_out) {
      title = `${record?.name || "Employee"} checked out`;
      time = record.check_out;
    }

    activityItem.innerHTML = `
      <div class="activity-icon">${icon}</div>
      <div class="activity-details">
        <div class="activity-title">${title}</div>
        <div class="activity-time">${time}</div>
      </div>
    `;

    activityList.appendChild(activityItem);
  });

  console.log(` Activity feed loaded with ${sortedRecords.slice(0, 10).length} items`);
}