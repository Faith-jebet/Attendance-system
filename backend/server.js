const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

app.set("trust proxy", true);

// Import routes
console.log("📦 Loading routes...");
const authRoutes = require("./routes/auth.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const adminRoutes = require("./routes/admin.routes");

// Import network restriction middleware
const restrictNetwork = require("./middleware/network.middleware");
console.log(" All route files loaded");

// Mount routes - RESTRICT ONLY AUTHENTICATION
app.use("/api/auth", restrictNetwork, authRoutes);  // Protected: Only campus network can login/register
app.use("/api/attendance", attendanceRoutes);        // Open: Logged-in users from anywhere can access
app.use("/api/admin", adminRoutes);                  // Open: Logged-in admins from anywhere can access

console.log(" Routes mounted");
console.log(" Network restriction ACTIVE on /api/auth");

// 404 handler
app.use((req, res) => {
  console.log(` 404: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on 0.0.0.0:5000");
});