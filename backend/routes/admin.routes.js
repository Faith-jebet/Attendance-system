const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const admin = require("../controllers/admin.controller");
const { getAllAttendance } = require("../controllers/attendance.controller");

// Get all users
router.get("/users", auth, role("ADMIN"), admin.getAllUsers);

// Delete user (soft delete)
router.delete("/users/:id", auth, role("ADMIN"), admin.deleteUser);

// Export users to CSV
router.get("/users/export/csv", auth, role("ADMIN"), admin.exportUsersCSV);

// Get all attendance records (ADMIN VIEW)
router.get("/attendance", auth, role("ADMIN"), getAllAttendance);

// Delete attendance record
router.delete("/attendance/:id", auth, role("ADMIN"), admin.deleteAttendance);

// Export attendance to Excel
router.get("/attendance/export/excel", auth, role("ADMIN"), admin.exportAttendanceExcel);

// Verify attendance (existing route)
router.get("/verify/:id", auth, role("ADMIN"), admin.verifyAttendance); 

// Get all settings
router.get("/settings", auth, role("ADMIN"), admin.getSettings);

// Update working hours
router.put("/settings/working-hours", auth, role("ADMIN"), admin.updateWorkingHours);

// Update attendance policies
router.put("/settings/policies", auth, role("ADMIN"), admin.updatePolicies);

// Update notification settings
router.put("/settings/notifications", auth, role("ADMIN"), admin.updateNotifications);

module.exports = router;