// =======================
// Authentication Handling
// =======================

// DOM Elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupForm = document.getElementById("signupForm");
const showSignupLink = document.getElementById("showSignup");
const backToLoginLink = document.getElementById("backToLogin");
const adminLogoutBtn = document.getElementById("adminLogout");
const userLogoutBtn = document.getElementById("userLogout");

// Login Handler
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      throw new Error("Please enter email and password");
    }

    const data = await window.api.login(email, password);
    const token = data.token;
    
    if (!token) {
      throw new Error("No token received from server");
    }
    
    localStorage.setItem("authToken", token);
    const payload = window.decodeJWT(token);

    if (payload?.role?.toUpperCase() === "ADMIN") {
      window.showPage(adminDashboard);
      if (window.loadOverviewData) window.loadOverviewData();
    } else {
      window.showPage(userAttendance);
      if (window.loadUserAttendance) window.loadUserAttendance();
    }
    
  } catch (error) {
    alert(error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Signup Toggle
showSignupLink?.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.style.display = "none";
  signupForm.style.display = "block";
});

backToLoginLink?.addEventListener("click", (e) => {
  e.preventDefault();
  signupForm.style.display = "none";
  loginForm.style.display = "block";
});

// Signup Handler
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const role = document.getElementById("signupRole").value;

  if (!name || !email || !password || !role) {
    alert("All fields are required");
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Signing up...";

    await window.api.register({ name, email, password, role });
    
    alert("Signup successful! Please log in.");
    signupForm.reset();
    signupForm.style.display = "none";
    loginForm.style.display = "block";
  } catch (err) {
    alert(err.message || "Signup failed");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Logout Handlers
adminLogoutBtn?.addEventListener("click", window.logout);
userLogoutBtn?.addEventListener("click", window.logout);