
const express = require("express");
const db = require("../config/db");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const { 
  markAttendance, 
  getUserAttendance,
  getTodayStatus,
  checkIn,
  checkOut
} = require("../controllers/attendance.controller");

router.get("/test", (req, res) => {
  console.log("🧪 Test route hit!");
  res.json({ message: "Attendance routes are working!" });
});

router.post("/test-mark", (req, res) => {
  console.log("🧪 Test mark route hit!");
  res.json({ message: "Mark route accessible!", body: req.body });
});

console.log("Attendance routes loaded");

// Mark attendance (authenticated users)
router.post("/mark", verifyToken, markAttendance);

// Check-in
router.post("/check-in", verifyToken, checkIn);

// Check-out
router.post("/check-out", verifyToken, checkOut);

// Get user's own attendance records
router.get("/my-records", verifyToken, getUserAttendance);

// Get today's attendance status
router.get("/today", verifyToken, getTodayStatus);

// Get all attendance (with optional month/year filter)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { month, year } = req.query;

    let sql = "SELECT * FROM attendance";
    const params = [];

    if (month && year) {
      const monthInt = parseInt(month, 10);
      const yearInt = parseInt(year, 10);
      
      if (!isNaN(monthInt) && !isNaN(yearInt)) {
        sql += " WHERE MONTH(date) = ? AND YEAR(date) = ?";
        params.push(monthInt, yearInt);
      }
    }

    sql += " ORDER BY date DESC";

    console.log("SQL:", sql);
    console.log("Params:", params);

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }
      res.json({
        success: true,
        data: results
      });
    });
  } catch (error) {
    console.error("Error in attendance route:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

module.exports = router;