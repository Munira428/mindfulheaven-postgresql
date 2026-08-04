const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require("cors");
const authRoutes = require("./routes/authRoute");
require("./db");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(authRoutes);
app.listen(process.env.PORT, () => console.log(`Auth server running on port ${process.env.PORT}`));