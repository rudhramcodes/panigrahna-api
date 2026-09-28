require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");
const inquiriesRouter = require("./routes/inquiries");

const app = express();
const PORT = process.env.PORT || 3000;

/* ── CORS Setup ── */
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://panigrahna.com",
  "https://www.panigrahna.com",
];

const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

const configuredOrigins = [...defaultOrigins, ...envOrigins];

const allowedOrigins = [
  ...new Set(
    configuredOrigins.flatMap((origin) => {
      const clean = origin.replace(/\/+$/, "");
      const res = [clean];
      if (/^https?:\/\/(www\.)?panigrahna\.com$/i.test(clean)) {
        res.push(
          "https://panigrahna.com",
          "https://www.panigrahna.com",
          "http://panigrahna.com",
          "http://www.panigrahna.com"
        );
      }
      return res;
    })
  ),
];

/* ── Middleware ── */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^https?:\/\/(www\.)?panigrahna\.com$/.test(origin);

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
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
