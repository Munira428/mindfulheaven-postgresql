const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log("Db connected"))
  .catch((e) => console.error("DB connection error:", e));

module.exports = pool;