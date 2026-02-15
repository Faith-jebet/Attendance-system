// =======================
// Utility Functions
// =======================

// DOM Elements
window.loginPage = document.getElementById("loginPage");
window.adminDashboard = document.getElementById("adminDashboard");
window.userAttendance = document.getElementById("userAttendance");

// Show specific page
window.showPage = function(page) {
  loginPage.classList.remove("active");
  adminDashboard.classList.remove("active");
  userAttendance.classList.remove("active");
  page.classList.add("active");
}

// Decode JWT token
window.decodeJWT = function(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// Get stored token
window.getToken = function() {
  return localStorage.getItem("authToken");
}

// Logout helper
window.logout = function() {
  localStorage.removeItem("authToken");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  if (loginForm) loginForm.reset();
  if (signupForm) signupForm.reset();
  showPage(loginPage);
}

// Update date and time
window.updateDateTime = function() {
  const now = new Date();

  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
  };
  const dateStr = now.toLocaleDateString("en-US", dateOptions);
  const currentDateElement = document.getElementById("currentDate");
  if (currentDateElement) {
    currentDateElement.textContent = dateStr;
  }

  const currentTimeElement = document.getElementById("currentTime");
  if (currentTimeElement) {
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    currentTimeElement.textContent = timeStr;
  }
}