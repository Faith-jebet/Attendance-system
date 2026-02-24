const db = require('../config/db');
const { hashData, signHash } = require('../utils/crypto.util');

// Helper to use async/await with MySQL
const query = (sql, params) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

// Calculate working hours
function calculateWorkingHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  
  const [inHour, inMin] = checkIn.split(':').map(Number);
  const [outHour, outMin] = checkOut.split(':').map(Number);
  
  const inMinutes = inHour * 60 + inMin;
  const outMinutes = outHour * 60 + outMin;
  
  const diffMinutes = outMinutes - inMinutes;
  return (diffMinutes / 60).toFixed(2);
}

// CHECK-IN
exports.checkIn = async (req, res) => {
  try {
    const { date, checkIn, status, notes, checkOut } = req.body;
    const userId = req.user.id;

    // Extract date-only to prevent timezone issues
    const dateOnly = date.split('T')[0];

    // Check if already checked in today
    const existing = await query(
      'SELECT * FROM attendance WHERE user_id = ? AND DATE(date) = ?',
      [userId, dateOnly]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in for this date'
      });
    }
    
// valid status
  const validStatuses = ['PRESENT', 'ABSENT', 'LEAVE'];
    const finalStatus = validStatuses.includes(status?.toUpperCase()) 
      ? status.toUpperCase() 
      : 'PRESENT';


    // Insert check-in
    const result = await query(
      'INSERT INTO attendance (user_id, date, check_in, status) VALUES (?, ?, ?, ?)',
      [userId, dateOnly, checkIn, finalStatus]
    );

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      data: { id: result.insertId, date: dateOnly, checkIn, status: finalStatus }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-in',
      error: error.message
    });
  }
};

// CHECK-OUT
exports.checkOut = async (req, res) => {
  try {
    const { date, checkOut } = req.body;
    const userId = req.user.id;

    // Extract date-only
    const dateOnly = date.split('T')[0];

    // Find today's attendance
    const existing = await query(
      'SELECT * FROM attendance WHERE user_id = ? AND DATE(date) = ?',
      [userId, dateOnly]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No check-in found for this date'
      });
    }

    if (existing[0].check_out) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out for this date'
      });
    }

    // Calculate working hours
    const workingHours = calculateWorkingHours(existing[0].check_in, checkOut);

    // Update check-out
    await query(
      'UPDATE attendance SET check_out = ?, working_hours = ? WHERE id = ?',
      [checkOut, workingHours, existing[0].id]
    );

    res.json({
      success: true,
      message: 'Checked out successfully',
      data: { checkOut, workingHours }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-out',
      error: error.message
    });
  }
};

// MARK ATTENDANCE (Combined check-in and check-out) - FIXED VERSION
exports.markAttendance = async (req, res) => {
  try {
    const { status, date, checkIn, checkOut, notes } = req.body;
    const userId = req.user.id;

    console.log("📝 Marking attendance...");
    console.log("Payload:", req.body);
    console.log("User ID:", userId);

    // Validate required fields
    if (!status || !date || !checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: status, date, and checkIn are required'
      });
    }

    // CRITICAL FIX: Extract only the date part (YYYY-MM-DD) without timezone conversion
    // This prevents the date from shifting to previous day due to UTC conversion
    const dateOnly = date.split('T')[0]; // Gets YYYY-MM-DD from "2026-02-14" or "2026-02-14T00:00:00"
    
    console.log("📅 Original date from client:", date);
    console.log("📅 Date to store in DB:", dateOnly);

    // Check if attendance already exists for this date
    const existing = await query(
      'SELECT * FROM attendance WHERE user_id = ? AND DATE(date) = ?',
      [userId, dateOnly]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date'
      });
    }

    // Calculate working hours
    const workingHours = calculateWorkingHours(checkIn, checkOut);

    // Insert attendance with date-only format (MySQL will store as DATE without time/timezone)
    const result = await query(
      'INSERT INTO attendance (user_id, status, date, check_in, check_out, working_hours, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, status, dateOnly, checkIn, checkOut || null, workingHours, notes || null]
    );

    // Fetch the created record with user info
    const attendance = await query(
      `SELECT a.*, u.name, u.email
       FROM attendance a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [result.insertId]
    );

    console.log("✅ Attendance marked successfully:", attendance[0]);

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance[0]
    });
  } catch (error) {
    console.error('❌ Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking attendance',
      error: error.message
    });
  }
};

// GET MY ATTENDANCE
exports.getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.user.id;

    let sql = 'SELECT * FROM attendance WHERE user_id = ?';
    const params = [userId];

    if (month !== undefined && year !== undefined) {
      sql += ' AND MONTH(date) = ? AND YEAR(date) = ?';
      params.push(parseInt(month) + 1, parseInt(year));
    }

    sql += ' ORDER BY date DESC';

    const results = await query(sql, params);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Fetch attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendance',
      error: error.message
    });
  }
};

// GET TODAY'S STATUS - FIXED VERSION
exports.getTodayStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get today's date in local timezone (not UTC)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    console.log("📅 Checking today's status for date:", todayStr);

    const results = await query(
      'SELECT * FROM attendance WHERE user_id = ? AND DATE(date) = ?',
      [userId, todayStr]
    );

    if (results.length === 0) {
      return res.json({
        success: true,
        data: { checkedIn: false }
      });
    }

    res.json({
      success: true,
      data: {
        checkedIn: true,
        checkIn: results[0].check_in,
        checkOut: results[0].check_out,
        workingHours: results[0].working_hours
      }
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// UPDATE NOTES
exports.updateNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    // Check if record exists and belongs to user
    const existing = await query(
      'SELECT * FROM attendance WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (existing[0].user_id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Update notes
    await query(
      'UPDATE attendance SET notes = ? WHERE id = ?',
      [notes, id]
    );

    res.json({
      success: true,
      message: 'Notes updated successfully'
    });
  } catch (error) {
    console.error('Update notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// GET ALL ATTENDANCE (ADMIN)
exports.getAllAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;

    let sql = `
      SELECT 
        a.id,
        a.user_id,
        u.name,
        u.email,
        a.date,
        a.check_in,
        a.check_out,
        a.working_hours,
        a.status,
        a.notes,
        a.verified
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE 1 = 1
    `;
    const params = [];

    if (month) {
      sql += " AND MONTH(a.date) = ?";
      params.push(parseInt(month));
    }

    if (year) {
      sql += " AND YEAR(a.date) = ?";
      params.push(parseInt(year));
    }

    sql += " ORDER BY a.date DESC";

    const results = await query(sql, params);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error("Admin attendance fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching attendance",
      error: error.message
    });
  }
};

// Export all functions
module.exports = {
  checkIn: exports.checkIn,
  checkOut: exports.checkOut,
  markAttendance: exports.markAttendance,
  getMyAttendance: exports.getMyAttendance,
  getUserAttendance: exports.getMyAttendance, // Alias for compatibility
  getTodayStatus: exports.getTodayStatus,
  updateNotes: exports.updateNotes,
  getAllAttendance: exports.getAllAttendance
};