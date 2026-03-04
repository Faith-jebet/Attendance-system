(async function initApp() {
  console.log("Initializing Attendance System...");

  // ============================================================
  // DATE / TIME — guard in case utils.js hasn't loaded yet
  // ============================================================
  if (typeof window.updateDateTime === "function") {
    window.updateDateTime();
    setInterval(window.updateDateTime, 1000);
  }

  // ============================================================
  // MOBILE SIDEBAR TOGGLE — purely additive, won't affect fetches
  // ============================================================
  const sidebarToggle  = document.getElementById("sidebarToggle");
  const sidebar        = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  function openSidebar() {
    sidebar && sidebar.classList.add("open");
    sidebarOverlay && sidebarOverlay.classList.add("visible");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar && sidebar.classList.remove("open");
    sidebarOverlay && sidebarOverlay.classList.remove("visible");
    document.body.style.overflow = "";
  }

  sidebarToggle  && sidebarToggle.addEventListener("click", openSidebar);
  sidebarOverlay && sidebarOverlay.addEventListener("click", closeSidebar);

  // ============================================================
  // NAVIGATION — original logic preserved exactly
  // ============================================================
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    item.addEventListener("click", async (e) => {
      e.preventDefault();

      // Auto-close sidebar on mobile when a nav item is tapped
      if (window.innerWidth <= 768) closeSidebar();

      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      const view = item.getAttribute("data-view");
      const headerTitle    = document.querySelector(".dashboard-header h1");
      const headerSubtitle = document.querySelector(".dashboard-header p");

      document.querySelectorAll(".content-section").forEach((section) => {
        section.style.display = "none";
      });

      switch (view) {
        case "overview":
          headerTitle.textContent    = "Dashboard Overview";
          headerSubtitle.textContent = "Welcome Back Admin!";
          document.getElementById("overviewSection").style.display = "block";
          if (window.loadOverviewData) window.loadOverviewData();
          break;

        case "employees":
          headerTitle.textContent    = "Employee Management";
          headerSubtitle.textContent = "Manage all registered employees here.";
          document.getElementById("employeesSection").style.display = "block";
          if (window.fetchEmployees) window.fetchEmployees();
          break;

        case "settings":
          headerTitle.textContent    = "Settings";
          headerSubtitle.textContent = "Manage your account settings.";
          document.getElementById("settingsSection").style.display = "block";
          if (window.loadSettings) window.loadSettings();
          break;

        case "attendance":
          headerTitle.textContent    = "Attendance Records";
          headerSubtitle.textContent = "View all employee attendance records.";
          const attendanceSection = document.getElementById("attendanceSection");
          if (attendanceSection) {
            attendanceSection.style.display = "block";
            const result  = await window.api.getAttendance();
            const records = result.data || result;
            if (window.displayAttendanceTable) window.displayAttendanceTable(records);
          }
          break;
      }
    });
  });

  // ============================================================
  // AUTH CHECK — original logic preserved exactly
  // ============================================================
  const token = window.getToken();

  if (token) {
    const payload = window.decodeJWT(token);

    if (payload?.role === "ADMIN") {
      window.showPage(adminDashboard);
      if (window.loadOverviewData) window.loadOverviewData();
    } else {
      window.showPage(userAttendance);
      if (window.loadUserAttendance) window.loadUserAttendance();
      UserAttendanceService.load();
    }
  } else {
    window.showPage(loginPage);
  }

  console.log("App initialized successfully!");
})();