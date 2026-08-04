const express = require("express");
const routes = require("./Routes/routes");
const app = express();
require("dotenv").config();
const cors = require("cors");
require("./db");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);
app.listen(process.env.PORT, () => console.log(`Therapist server running on port ${process.env.PORT}`));