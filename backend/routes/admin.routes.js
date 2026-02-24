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

exports.getSettings = async (req, res) => {
  try {
    const results = await query('SELECT * FROM system_settings ORDER BY id');
    
    // Convert to a key-value object for easier frontend use
    const settings = {};
    results.forEach(row => {
      let value = row.setting_value;
      // Auto-cast by type
      if (row.setting_type === 'boolean') value = value === 'true';
      if (row.setting_type === 'number') value = parseFloat(value);
      settings[row.setting_key] = value;
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings', error: error.message });
  }
};

// UPDATE WORKING HOURS
exports.updateWorkingHours = async (req, res) => {
  try {
    const { work_start_time, work_end_time } = req.body;
    const adminId = req.user.id;

    await query('UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?', 
      [work_start_time, adminId, 'work_start_time']);
    await query('UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?', 
      [work_end_time, adminId, 'work_end_time']);

    res.json({ success: true, message: 'Working hours updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating working hours', error: error.message });
  }
};

// UPDATE POLICIES
exports.updatePolicies = async (req, res) => {
  try {
    const { late_threshold_minutes, full_day_hours } = req.body;
    const adminId = req.user.id;

    await query('UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?', 
      [late_threshold_minutes, adminId, 'late_threshold_minutes']);
    await query('UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?', 
      [full_day_hours, adminId, 'full_day_hours']);

    res.json({ success: true, message: 'Policies updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating policies', error: error.message });
  }
};

// UPDATE NOTIFICATIONS
exports.updateNotifications = async (req, res) => {
  try {
    const { notify_absent, notify_late, notify_leave } = req.body;
    const adminId = req.user.id;

    await query('UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?', 
      [notify_absent, adminId, 'notify_absent']);
    await query('UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?', 
      [notify_late, adminId, 'notify_late']);
    await query('UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?', 
      [notify_leave, adminId, 'notify_leave']);

    res.json({ success: true, message: 'Notification settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating notifications', error: error.message });
  }
};


module.exports = router;