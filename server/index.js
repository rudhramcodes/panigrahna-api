require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");
const inquiriesRouter = require("./routes/inquiries");

const app = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ── */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["POST", "GET", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

/* ── Routes ── */
app.use("/api/inquiries", inquiriesRouter);

/* ── Health check ── */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ── Global error handler ── */
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
  });
});

/* ── Start ── */
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Panigrahna API running on http://localhost:${PORT}`);
  });
}

start();
