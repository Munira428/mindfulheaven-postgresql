const User = require("../models/User");
const JWT = require("jsonwebtoken");

require("dotenv").config();

const maxAge = 3 * 60 * 60 * 24;
const SECRET_KEY = process.env.SECRET_KEY;

const CreateToken = (id, email) => {
  return JWT.sign({ id, email }, SECRET_KEY, { expiresIn: maxAge });
};

module.exports.signup_post = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name) return res.status(400).json({ name: "please enter your name" });
    if (!email) return res.status(400).json({ email: "please enter an email" });
    if (!password || password.length < 6)
      return res.status(400).json({ password: "minimum length is 6" });

    const user = await User.createUser(name, email, password);
    res.status(201).json({ user: user.id });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ email: "The email is already registered" });
    }
    console.error(err);
    res.status(400).json({ msg: "Signup failed" });
  }
};

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    const token = CreateToken(user.id, user.email);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000, sameSite: "Lax" });
    res.status(201).json({ user: user.id });
  } catch (err) {
    console.log(err.message);
    res.status(400).json({ msg: "Error logging in! Try again!" });
  }
};

module.exports.logout_post = async (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports.get_details = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    let decoded;
    try {
      decoded = JWT.verify(token, process.env.SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    if (String(decoded.id) !== String(req.params.id)) {
      return res.status(403).json({ message: "Not authorized to view this data" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const scores = await User.getScores(req.params.id);
    const depressionScores = scores.filter(s => s.type === 'depression').map(s => s.score);
    const anxietyScores = scores.filter(s => s.type === 'anxiety').map(s => s.score);
    const stressScores = scores.filter(s => s.type === 'stress').map(s => s.score);

    res.json({ ...user, depressionScores, anxietyScores, stressScores });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.update_depression_score = async (req, res) => {
  try {
    const { userId, score } = req.body;
    await User.addScore(userId, "depression", score);
    res.status(200).json({ message: "Depression score updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.update_anxiety_score = async (req, res) => {
  try {
    const { userId, score } = req.body;
    await User.addScore(userId, "anxiety", score);
    res.status(200).json({ message: "Anxiety score updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.update_stress_score = async (req, res) => {
  try {
    const { userId, score } = req.body;
    await User.addScore(userId, "stress", score);
    res.status(200).json({ message: "Stress score updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};