const pool = require("../db");
const nodemailer = require("nodemailer");

module.exports.suggest_therapist = async (req, res) => {
  try {
    const { category, type } = req.body;
    const result = await pool.query(
      "SELECT * FROM therapists WHERE category = $1 AND type = $2",
      [category, type]
    );
    const response = result.rows.map((t) => ({
      therapistId: t.id,
      therapistName: t.name,
      therapistAddress: t.address,
      therapistNumber: t.number,
      therapistEmail: t.email,
      therapistRatings: t.ratings,
    }));
    res.json(response);
  } catch (error) {
    console.error("Error suggesting therapist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports.getTherapistById = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM therapists WHERE id = $1", [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: "Therapist not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching therapist details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports.schedule_session = async (req, res) => {
  try {
    const { userId, therapistId, startTime, endTime } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);

    const startHour = start.getHours();
    const endHour = end.getHours();
    if (startHour < 9 || startHour > 18 || endHour < 9 || endHour > 18) {
      return res.status(400).json({ error: "Sessions can only be booked between 9 AM and 6 PM." });
    }

    const existing = await pool.query(
      `SELECT s.start_time, s.end_time FROM session_bookings sb
       JOIN sessions s ON sb.session_id = s.id
       WHERE sb.therapist_id = $1`,
      [therapistId]
    );
    const conflict = existing.rows.some(
      (s) => new Date(s.start_time) <= end && new Date(s.end_time) >= start
    );
    if (conflict) {
      return res.status(409).json({ error: "The proposed session time conflicts with an existing session." });
    }

    const sessionResult = await pool.query(
      "INSERT INTO sessions (start_time, end_time) VALUES ($1, $2) RETURNING id",
      [start, end]
    );
    const sessionId = sessionResult.rows[0].id;

    const bookingResult = await pool.query(
      "INSERT INTO session_bookings (user_id, therapist_id, session_id) VALUES ($1, $2, $3) RETURNING *",
      [userId, therapistId, sessionId]
    );

    res.status(201).json({ message: "Session scheduled successfully", sessionBooking: bookingResult.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while scheduling the session." });
  }
};

module.exports.therapistSessions = async (req, res) => {
  try {
    const { therapistId } = req.params;
    const result = await pool.query(
      `SELECT sb.*, s.start_time, s.end_time FROM session_bookings sb
       JOIN sessions s ON sb.session_id = s.id
       WHERE sb.therapist_id = $1`,
      [therapistId]
    );
    res.status(200).json({ bookingDetails: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching therapist sessions." });
  }
};

module.exports.userSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT sb.*, s.start_time, s.end_time FROM session_bookings sb
       JOIN sessions s ON sb.session_id = s.id
       WHERE sb.user_id = $1`,
      [userId]
    );
    res.status(200).json({ bookingDetails: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching user sessions." });
  }
};