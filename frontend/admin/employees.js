// =======================
// Employee Management
// =======================

// Fetch and display employees
window.fetchEmployees = async function() {
  const employeeTable = document.getElementById("employeeTable");
  if (!employeeTable) return;
  
  try {
    employeeTable.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 32px;">Loading...</td></tr>`;
    
    const result = await window.api.getUsers();
    const employees = result.data || result;

    document.getElementById("totalEmployeesCount").textContent = employees.length;
    document.getElementById("activeEmployeesCount").textContent = 
      employees.filter(e => e.role && e.role !== 'INACTIVE').length;
    document.getElementById("avgAttendanceRate").textContent = "95%";

    displayEmployees(employees);
  } catch (err) {
    employeeTable.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #e53e3e; padding: 32px;">Error: ${err.message}</td></tr>`;
  }
}

function displayEmployees(employees) {
  const employeeTable = document.getElementById("employeeTable");
  if (!employeeTable) return;

  employeeTable.innerHTML = "";

  if (employees.length === 0) {
    employeeTable.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 32px; color: #a0aec0;">No employees found</td></tr>`;
    return;
  }

  employees.forEach((emp) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${emp.id}</td>
      <td><strong>${emp.name}</strong></td>
      <td>${emp.email}</td>
      <td><span class="status-badge ${emp.role?.toLowerCase() || "employee"}">${emp.role || "EMPLOYEE"}</span></td>
      <td><span class="status-badge-employee active">Active</span></td>
      <td>92%</td>
      <td class="employee-actions-btn">
        <button class="btn-action btn-view" onclick="window.viewEmployee(${emp.id})">👁️ View</button>
        <button class="btn-action btn-delete" onclick="window.deleteEmployee(${emp.id})">🗑️ Delete</button>
      </td>
    `;
    employeeTable.appendChild(row);
  });
}

// Employee search
document.getElementById("employeeSearch")?.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const rows = document.querySelectorAll("#employeeTable tr");

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? "" : "none";
  });
});

// Role filter
document.getElementById("roleFilter")?.addEventListener("change", async (e) => {
  try {
    const result = await window.api.getUsers();
    let employees = result.data || result;

    const filterRole = e.target.value;
    if (filterRole) {
      employees = employees.filter((emp) => emp.role === filterRole);
    }

    displayEmployees(employees);
  } catch (error) {
    console.error("Filter error:", error);
  }
});

// View employee
window.viewEmployee = function(id) {
  alert(`View employee details for ID: ${id}\n(This would open a modal with full employee details)`);
}

// Delete employee
window.deleteEmployee = async function(id) {
  if (!confirm(`Are you sure you want to delete employee ${id}?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    await window.api.deleteUser(id);
    alert(`Employee deleted successfully!`);
    window.fetchEmployees();
  } catch (error) {
    alert(error.message);
  }
}

// Add Employee button
document.getElementById("addEmployeeBtn")?.addEventListener("click", () => {
  alert("Add Employee functionality - This would open a modal form");
});