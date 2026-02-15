const db = require("../config/db");
const { verifySignature } = require("../utils/crypto.util");
const ExcelJS = require('exceljs');

exports.verifyAttendance = (req, res) => {
  const attendanceId = req.params.id;

  const query = `
    SELECT a.id, a.hash, a.digital_signature, u.public_key
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `;

  db.query(query, [attendanceId], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0)
      return res.status(404).json({ message: "Attendance record not found" });

    const record = results[0];

    const isValid = verifySignature(
      record.hash,
      record.digital_signature,
      record.public_key
    );

    res.json({
      attendanceId: record.id,
      verified: isValid,
      message: isValid
        ? "Attendance record is authentic and untampered"
        : "Attendance record has been tampered with"
    });
  });
};

// GET ALL USERS (Updated to exclude soft-deleted)
exports.getAllUsers = (_req, res) => {
  console.log("Fetching all users");
  const query = `SELECT id, name, email, role FROM users WHERE deleted_at IS NULL`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching users", 
        error: err 
      });
    }

    console.log("Users fetched successfully:", results.length);
    res.status(200).json({
      success: true,
      data: results
    });
  });
};

// DELETE USER (SOFT DELETE)
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  console.log(`Attempting to delete user ID: ${id}`);

  // Prevent deleting yourself
  if (parseInt(id) === currentUserId) {
    return res.status(403).json({
      success: false,
      message: "Cannot delete your own account"
    });
  }

  // Check if user exists
  const checkQuery = 'SELECT id, name, role FROM users WHERE id = ? AND deleted_at IS NULL';
  
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: "Server error while checking user"
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or already deleted"
      });
    }

    const user = results[0];

    // Prevent deleting admins
    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin users"
      });
    }

    // Soft delete
    const deleteQuery = 'UPDATE users SET deleted_at = NOW() WHERE id = ?';
    
    db.query(deleteQuery, [id], (deleteErr) => {
      if (deleteErr) {
        console.error('Delete error:', deleteErr);
        return res.status(500).json({
          success: false,
          message: "Server error while deleting employee"
        });
      }

      console.log(`User ${id} soft deleted successfully`);
      
      res.json({
        success: true,
        message: "Employee deleted successfully",
        data: {
          id: parseInt(id),
          name: user.name
        }
      });
    });
  });
};

// DELETE ATTENDANCE RECORD
exports.deleteAttendance = (req, res) => {
  const { id } = req.params;
  
  console.log(`Attempting to delete attendance record ID: ${id}`);

  const checkQuery = 'SELECT id, user_id, date FROM attendance WHERE id = ?';
  
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    const deleteQuery = 'DELETE FROM attendance WHERE id = ?';
    
    db.query(deleteQuery, [id], (deleteErr) => {
      if (deleteErr) {
        console.error('Delete error:', deleteErr);
        return res.status(500).json({
          success: false,
          message: "Server error while deleting record"
        });
      }

      console.log(`Attendance record ${id} deleted successfully`);
      
      res.json({
        success: true,
        message: "Attendance record deleted successfully",
        data: { id: parseInt(id) }
      });
    });
  });
};

// GET ALL SETTINGS
exports.getSettings = (req, res) => {
  console.log("Fetching system settings");
  
  const query = 'SELECT * FROM system_settings';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: "Error fetching settings"
      });
    }

    const settingsData = {
      workingHours: {},
      policies: {},
      notifications: {}
    };
    
    results.forEach(setting => {
      const value = setting.setting_type === 'boolean' 
        ? setting.setting_value === 'true'
        : setting.setting_type === 'number'
        ? parseFloat(setting.setting_value)
        : setting.setting_value;
      
      if (setting.setting_key.startsWith('work_')) {
        settingsData.workingHours[setting.setting_key] = value;
      } else if (setting.setting_key.startsWith('notify_')) {
        settingsData.notifications[setting.setting_key] = value;
      } else {
        settingsData.policies[setting.setting_key] = value;
      }
    });
    
    res.json({
      success: true,
      data: settingsData
    });
  });
};

// UPDATE WORKING HOURS
exports.updateWorkingHours = (req, res) => {
  const { work_start_time, work_end_time } = req.body;
  const userId = req.user.id;
  
  console.log("Updating working hours:", { work_start_time, work_end_time });
  
  if (!work_start_time || !work_end_time) {
    return res.status(400).json({
      success: false,
      message: "Both start and end times are required"
    });
  }
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(work_start_time) || !timeRegex.test(work_end_time)) {
    return res.status(400).json({
      success: false,
      message: "Invalid time format. Use HH:MM (e.g., 09:00)"
    });
  }
  
  const updateStartQuery = `
    UPDATE system_settings 
    SET setting_value = ?, updated_by = ?, updated_at = NOW() 
    WHERE setting_key = 'work_start_time'
  `;
  
  const updateEndQuery = `
    UPDATE system_settings 
    SET setting_value = ?, updated_by = ?, updated_at = NOW() 
    WHERE setting_key = 'work_end_time'
  `;
  
  db.query(updateStartQuery, [work_start_time, userId], (err1) => {
    if (err1) {
      console.error('Update error:', err1);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
    
    db.query(updateEndQuery, [work_end_time, userId], (err2) => {
      if (err2) {
        console.error('Update error:', err2);
        return res.status(500).json({
          success: false,
          message: "Server error"
        });
      }
      
      res.json({
        success: true,
        message: "Working hours updated successfully",
        data: { work_start_time, work_end_time }
      });
    });
  });
};

// UPDATE ATTENDANCE POLICIES
exports.updatePolicies = (req, res) => {
  const { late_threshold_minutes, half_day_hours, full_day_hours } = req.body;
  const userId = req.user.id;
  
  console.log("Updating attendance policies:", req.body);
  
  if (late_threshold_minutes !== undefined && (late_threshold_minutes < 0 || late_threshold_minutes > 60)) {
    return res.status(400).json({
      success: false,
      message: "Late threshold must be between 0 and 60 minutes"
    });
  }
  
  if (half_day_hours !== undefined && (half_day_hours < 1 || half_day_hours > 12)) {
    return res.status(400).json({
      success: false,
      message: "Half day hours must be between 1 and 12"
    });
  }
  
  if (full_day_hours !== undefined && (full_day_hours < 1 || full_day_hours > 12)) {
    return res.status(400).json({
      success: false,
      message: "Full day hours must be between 1 and 12"
    });
  }
  
  const updates = { late_threshold_minutes, half_day_hours, full_day_hours };
  let completed = 0;
  let hasError = false;
  const totalUpdates = Object.values(updates).filter(v => v !== undefined).length;
  
  if (totalUpdates === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid updates provided"
    });
  }
  
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const query = `
        UPDATE system_settings 
        SET setting_value = ?, updated_by = ?, updated_at = NOW() 
        WHERE setting_key = ?
      `;
      
      db.query(query, [value.toString(), userId, key], (err) => {
        if (err && !hasError) {
          hasError = true;
          console.error('Update policies error:', err);
          return res.status(500).json({
            success: false,
            message: "Server error"
          });
        }
        
        completed++;
        
        if (completed === totalUpdates && !hasError) {
          res.json({
            success: true,
            message: "Attendance policies updated successfully",
            data: updates
          });
        }
      });
    }
  }
};

// UPDATE NOTIFICATION SETTINGS
exports.updateNotifications = (req, res) => {
  const { notify_absent, notify_late, notify_leave } = req.body;
  const userId = req.user.id;
  
  console.log("Updating notification settings:", req.body);
  
  const updates = { notify_absent, notify_late, notify_leave };
  let completed = 0;
  let hasError = false;
  const totalUpdates = Object.values(updates).filter(v => v !== undefined).length;
  
  if (totalUpdates === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid updates provided"
    });
  }
  
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const query = `
        UPDATE system_settings 
        SET setting_value = ?, updated_by = ?, updated_at = NOW() 
        WHERE setting_key = ?
      `;
      
      db.query(query, [value ? 'true' : 'false', userId, key], (err) => {
        if (err && !hasError) {
          hasError = true;
          console.error('Update notifications error:', err);
          return res.status(500).json({
            success: false,
            message: "Server error"
          });
        }
        
        completed++;
        
        if (completed === totalUpdates && !hasError) {
          res.json({
            success: true,
            message: "Notification settings updated successfully",
            data: updates
          });
        }
      });
    }
  }
};

// EXPORT ATTENDANCE TO EXCEL
exports.exportAttendanceExcel = async (req, res) => {
  try {
    const { month, year, status } = req.query;
    
    console.log("Exporting attendance to Excel:", { month, year, status });
    
    let query = `
      SELECT 
        a.id, a.user_id, u.name, u.email,
        a.date, a.check_in, a.check_out,
        a.status, a.working_hours, a.notes
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE u.deleted_at IS NULL
    `;
    
    const params = [];
    
    if (month && year) {
      query += ` AND MONTH(a.date) = ? AND YEAR(a.date) = ?`;
      params.push(month, year);
    }
    
    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY a.date DESC, u.name ASC`;
    
    db.query(query, params, async (err, records) => {
      if (err) {
        console.error('Export query error:', err);
        return res.status(500).json({
          success: false,
          message: "Server error"
        });
      }
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Records');
      
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Employee ID', key: 'user_id', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Check In', key: 'check_in', width: 15 },
        { header: 'Check Out', key: 'check_out', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Hours', key: 'working_hours', width: 10 },
        { header: 'Notes', key: 'notes', width: 30 }
      ];
      
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      
      records.forEach(record => {
        worksheet.addRow({
          ...record,
          date: new Date(record.date).toLocaleDateString(),
          status: record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A'
        });
      });
      
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=attendance_${Date.now()}.xlsx`
      );
      
      await workbook.xlsx.write(res);
      res.end();
    });
    
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// EXPORT USERS TO CSV
exports.exportUsersCSV = (req, res) => {
  console.log("Exporting users to CSV");
  
  const query = 'SELECT id, name, email, role FROM users WHERE deleted_at IS NULL ORDER BY id';
  
  db.query(query, (err, users) => {
    if (err) {
      console.error('Export query error:', err);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
    
    const csvRows = ['ID,Name,Email,Role'];
    
    users.forEach(user => {
      const name = `"${user.name.replace(/"/g, '""')}"`;
      const email = `"${user.email.replace(/"/g, '""')}"`;
      csvRows.push(`${user.id},${name},${email},${user.role}`);
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=employees_${Date.now()}.csv`
    );
    
    res.send(csvRows.join('\n'));
  });
};