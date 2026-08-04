const bcrypt = require("bcrypt");
const pool = require("../db");

const createUser = async (name, email, password) => {
  const hashed = await bcrypt.hash(password, await bcrypt.genSalt());
  const result = await pool.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, email",
    [name, email, hashed]
  );
  return result.rows[0];
};

const login = async (email, password) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];
  if (!user) throw new Error("enter a registered email");

  const auth = await bcrypt.compare(password, user.password);
  if (!auth) throw new Error("Incorrect password");

  return user;
};

const findById = async (id) => {
  const result = await pool.query(
    "SELECT id, name, email FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

const addScore = async (userId, type, score) => {
  await pool.query(
    "INSERT INTO scores (user_id, type, score) VALUES ($1, $2, $3)",
    [userId, type, score]
  );
};

module.exports = { createUser, login, findById, addScore };