const AttendanceAdmin = {
  currentPage: 1,
  rowsPerPage: 10,
  allRecords: [],
  filteredRecords: [],
  
  async init() {
    console.log(" Initializing Attendance Admin...");
    
    // Load initial data
    await this.loadAttendance();
    
    // Setup event listeners
    this.setupFilters();
    this.setupPagination();
    this.setupExport();
    
    console.log("✅ Attendance Admin initialized");
  },
  
  async loadAttendance() {
    try {
      const monthFilter = document.getElementById('attendanceMonthFilter');
      const yearFilter = document.getElementById('attendanceYearFilter');
      
      const params = {
        month: parseInt(monthFilter.value) + 1, // Convert 0-11 to 1-12
        year: parseInt(yearFilter.value)
      };
      
      console.log("📥 Loading attendance with filters:", params);
      
      const response = await api.getAttendance(params);
      this.allRecords = response.data || response || [];
      
      console.log("Loaded", this.allRecords.length, "records");
      
      // Apply status filter and render
      this.applyFilters();
      
    } catch (error) {
      console.error("Error loading attendance:", error);
      this.showError("Failed to load attendance records");
    }
  },
  
  applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value.toLowerCase();
    
    if (!statusFilter) {
      this.filteredRecords = [...this.allRecords];
    } else {
      this.filteredRecords = this.allRecords.filter(record => 
        record.status?.toLowerCase() === statusFilter
      );
    }
    
    console.log("🔍 Filtered to", this.filteredRecords.length, "records");
    
    // Reset to page 1 when filtering
    this.currentPage = 1;
    this.render();
  },
  
  render() {
    const tbody = document.getElementById('attendanceTableBody');
    
    if (!tbody) {
      console.error("Attendance table body not found");
      return;
    }
    
    if (this.filteredRecords.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: #a0aec0;">
            No attendance records found for the selected filters
          </td>
        </tr>
      `;
      this.updatePaginationInfo(0, 0);
      return;
    }
    
    // Calculate pagination
    const startIdx = (this.currentPage - 1) * this.rowsPerPage;
    const endIdx = startIdx + this.rowsPerPage;
    const pageRecords = this.filteredRecords.slice(startIdx, endIdx);
    
    // Render table rows
    tbody.innerHTML = pageRecords.map(record => {
      const statusClass = (record.status || 'present').toLowerCase();
      const date = this.formatDate(record.date);
      
      return `
        <tr>
          <td>${record.user_id || '-'}</td>
          <td>${record.name || 'Unknown'}</td>
          <td>${date}</td>
          <td>${record.check_in || '-'}</td>
          <td>${record.check_out || '-'}</td>
          <td><span class="status-badge status-${statusClass}">${record.status || 'PRESENT'}</span></td>
          <td>${record.working_hours || '0.00'}h</td>
          <td>${record.notes || '-'}</td>
        </tr>
      `;
    }).join('');
    
    // Update pagination
    const totalPages = Math.ceil(this.filteredRecords.length / this.rowsPerPage);
    this.updatePaginationInfo(this.currentPage, totalPages);
  },
  
  formatDate(dateStr) {
    if (!dateStr) return '-';
    
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}/${day}/${year}`;
    } catch (e) {
      return dateStr;
    }
  },
  
  updatePaginationInfo(currentPage, totalPages) {
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (!pageInfo || !prevBtn || !nextBtn) return;
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    
    // Enable/disable buttons
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
    
    // Update button styles
    prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
    nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
    prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
    nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
  },
  
  setupFilters() {
    const monthFilter = document.getElementById('attendanceMonthFilter');
    const yearFilter = document.getElementById('attendanceYearFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (monthFilter) {
      monthFilter.addEventListener('change', () => {
        console.log("📅 Month filter changed");
        this.loadAttendance();
      });
    }
    
    if (yearFilter) {
      yearFilter.addEventListener('change', () => {
        console.log("📅 Year filter changed");
        this.loadAttendance();
      });
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        console.log("🔍 Status filter changed");
        this.applyFilters();
      });
    }
  },
  
  setupPagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          console.log("⬅️ Previous page:", this.currentPage);
          this.render();
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(this.filteredRecords.length / this.rowsPerPage);
        if (this.currentPage < totalPages) {
          this.currentPage++;
          console.log("➡️ Next page:", this.currentPage);
          this.render();
        }
      });
    }
  },
  
  setupExport() {
    const exportBtn = document.getElementById('exportAttendanceBtn');
    
    if (!exportBtn) {
      console.warn("⚠️ Export button not found");
      return;
    }
    
    exportBtn.addEventListener('click', async () => {
      try {
        console.log("📥 Exporting attendance to Excel...");
        exportBtn.disabled = true;
        exportBtn.textContent = '⏳ Exporting...';
        
        await this.exportToExcel();
        
        exportBtn.textContent = 'Exported!';
        setTimeout(() => {
          exportBtn.textContent = '📥 Export to Excel';
          exportBtn.disabled = false;
        }, 2000);
        
      } catch (error) {
        console.error("❌ Export failed:", error);
        alert("Failed to export: " + error.message);
        exportBtn.textContent = '📥 Export to Excel';
        exportBtn.disabled = false;
      }
    });
  },
  
  async exportToExcel() {
    // Use the filtered records for export
    const data = this.filteredRecords;
    
    if (data.length === 0) {
      alert("No data to export");
      return;
    }
    
    // Create CSV content
    const headers = ['Employee ID', 'Name', 'Email', 'Date', 'Check-In', 'Check-Out', 'Status', 'Hours', 'Notes'];
    const csvRows = [headers.join(',')];
    
    data.forEach(record => {
      const row = [
        record.user_id || '',
        `"${record.name || ''}"`, // Wrap in quotes to handle commas
        record.email || '',
        this.formatDate(record.date),
        record.check_in || '',
        record.check_out || '',
        record.status || '',
        record.working_hours || '0',
        `"${record.notes || ''}"` // Wrap in quotes
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const monthFilter = document.getElementById('attendanceMonthFilter');
    const yearFilter = document.getElementById('attendanceYearFilter');
    const month = monthFilter.options[monthFilter.selectedIndex].text;
    const year = yearFilter.value;
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${month}_${year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("Exported", data.length, "records to CSV");
  },
  
  showError(message) {
    const tbody = document.getElementById('attendanceTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: #e53e3e;">
             ${message}
          </td>
        </tr>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  console.log("📋 Attendance Admin script loaded");
  
  // Initialize if on attendance page
  const attendanceSection = document.getElementById('attendanceSection');
  if (attendanceSection && !attendanceSection.style.display === 'none') {
    AttendanceAdmin.init();
  }
  
  // Listen for navigation to attendance section
  const navItems = document.querySelectorAll('.nav-item[data-view="attendance"]');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      setTimeout(() => {
        AttendanceAdmin.init();
      }, 100);
    });
  });
});

// Export for global access
if (typeof window !== 'undefined') {
  window.AttendanceAdmin = AttendanceAdmin;
}