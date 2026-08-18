const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./database/db");
const Contact = require("./models/Contact");

const app = express();
const PORT = process.env.PORT || 5000;
const frontendOrigins = [process.env.CLIENT_URL]
  .filter(Boolean)
  .flatMap((origin) => origin.split(",").map((value) => value.trim()))
  .filter(Boolean);
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...frontendOrigins,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const hostname = new URL(origin).hostname;
      const isAllowedOrigin =
        allowedOrigins.includes(origin) ||
        hostname.endsWith(".onrender.com") ||
        hostname.endsWith(".netlify.app") ||
        hostname === "onrender.com" ||
        hostname === "netlify.app";

      if (isAllowedOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, message: "Server is running" });
});

app.post("/api/contacts", async (req, res) => {
  try {
    const { name, email, comment } = req.body;

    const contact = await Contact.create({ name, email, comment });

    res.status(201).json({
      success: true,
      message: "Message submitted successfully",
      id: contact._id,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((item) => item.message);
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting the message",
    });
  }
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
