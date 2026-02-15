const UserAttendanceService = {
  tableBody: document.getElementById("userAttendanceTableBody"),
  
  async load() {
    console.log("📊 Loading user attendance data...");
    
    if (!this.tableBody) {
      console.error(" User attendance table body not found!");
      return;
    }
    
    try {
      this.tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 1rem;">Loading...</td></tr>';
      
      const result = await api.getUserAttendance();
      console.log(" User attendance data received:", result);
      
      const records = result.data || result || [];
      this.render(records);
      
    } catch (error) {
      console.error(" Error loading user attendance:", error);
      this.tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 1rem; color: #e53e3e;">${error.message}</td></tr>`;
    }
  },
  
  render(records) {
    if (!records || records.length === 0) {
      this.tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 1rem;">No attendance records found</td></tr>';
      return;
    }
    
    this.tableBody.innerHTML = records.map(record => `
      <tr>
        <td>${record.date}</td>
        <td>${record.check_in || '-'}</td>
        <td>${record.check_out || '-'}</td>
        <td><span class="status-badge status-${(record.status || 'present').toLowerCase()}">${record.status || 'PRESENT'}</span></td>
        <td>${record.working_hours || '0.00'}</td>
        <td>${record.notes || '-'}</td>
      </tr>
    `).join('');
  }
};


function setupMarkAttendance() {
  const markBtn = document.getElementById('markAttendanceBtn');
  
  if (!markBtn) {
    console.error(" Mark Attendance button not found!");
    return;
  }
  
  console.log(" Mark Attendance button found");
  
  markBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    console.log("📝 Mark Attendance button clicked!");
    
    // Get form values
    const date = document.getElementById('attendanceDate').value;
    const checkIn = document.getElementById('checkInTime').value;
    const checkOut = document.getElementById('checkOutTime').value;
    const status = document.getElementById('attendanceStatus').value;
    const notes = document.getElementById('attendanceNotes').value;
    
    console.log("📋 Form values:");
    console.log("  Date:", date, typeof date);
    console.log("  Check-in:", checkIn);
    console.log("  Check-out:", checkOut);
    console.log("  Status:", status);
    console.log("  Notes:", notes);
    
    // Validate required fields
    if (!date) {
      alert(' Please select a date');
      return;
    }
    
    if (!checkIn) {
      alert(' Please enter check-in time');
      return;
    }
    
    if (!status) {
      alert(' Please select status');
      return;
    }
    
    // CRITICAL: Ensure date is in YYYY-MM-DD format only (no time component)
    const dateOnly = date.split('T')[0]; 
    
    const formData = {
      date: dateOnly, 
      checkIn: checkIn,
      checkOut: checkOut || null,
      status: status.toUpperCase(), 
      notes: notes || ''
    };
    
    console.log("📤 Submitting attendance:", formData);
    
    try {
      markBtn.disabled = true;
      markBtn.textContent = 'Marking...';
      
      const result = await api.markAttendance(formData);
      console.log(" Attendance marked successfully:", result);
      
      // Show success message
      alert('Attendance marked successfully!');
      
      // Clear form
      document.getElementById('attendanceDate').value = '';
      document.getElementById('checkInTime').value = '';
      document.getElementById('checkOutTime').value = '';
      document.getElementById('attendanceStatus').value = '';
      document.getElementById('attendanceNotes').value = '';
      
      // Reload attendance table
      await UserAttendanceService.load();
      
      // Reload dashboard if on admin page
      if (typeof window.loadOverviewData === 'function') {
        await window.loadOverviewData();
      }
      
    } catch (error) {
      console.error(" Error marking attendance:", error);
      alert(' Error: ' + error.message);
    } finally {
      markBtn.disabled = false;
      markBtn.textContent = 'Mark Attendance';
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
  console.log("Initializing User Attendance System...");
  
  // Only initialize if we're on the user attendance page
  const userAttendancePage = document.getElementById('userAttendance');
  if (!userAttendancePage) {
    console.log(" Not on user attendance page, skipping initialization");
    return;
  }
  
  // Get today's date in local timezone (YYYY-MM-DD format)
  const dateInput = document.getElementById('attendanceDate');
  if (dateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    dateInput.value = todayStr;
    dateInput.max = todayStr; // Prevent future dates
    
    console.log("📅 Date input set to:", todayStr);
  }
  
  // Set current time in check-in
  const checkInInput = document.getElementById('checkInTime');
  if (checkInInput) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    checkInInput.value = `${hours}:${minutes}`;
    
    console.log("⏰ Check-in time set to:", `${hours}:${minutes}`);
  }
  
  // Setup mark attendance button
  setupMarkAttendance();
  
  // Load attendance records
  UserAttendanceService.load();
  
  console.log(" User Attendance System initialized!");
});

// Export for use in other files
if (typeof window !== 'undefined') {
  window.UserAttendanceService = UserAttendanceService;
}