const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

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

const authRouter = require('./routes/auth').router;
app.use('/api/auth', authRouter);

const Inquiry = require("./models/Inquiry");
const Chatbot = require("./models/Chatbot");

app.post("/api/inquiries", async (req, res) => {
  try {
    const { name, email, service, budget, address, message } = req.body;

    const inquiry = await Inquiry.create({ name, email, service, budget, address, message });

    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully",
      id: inquiry._id,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((item) => item.message);
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting the inquiry",
    });
  }
});

// Get all inquiries (enriched with chat history from Chatbot collection)
app.get("/api/inquiries", async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 }).lean();
    const chatbots = await Chatbot.find().lean();

    const chatMap = new Map();
    chatbots.forEach((c) => {
      if (c.email) {
        chatMap.set(c.email.trim().toLowerCase(), c.messages || []);
      }
    });

    const enrichedInquiries = inquiries.map((inq) => {
      const emailKey = inq.email ? inq.email.trim().toLowerCase() : "";
      return {
        ...inq,
        chatHistory: chatMap.get(emailKey) || [],
      };
    });

    res.status(200).json({ success: true, data: enrichedInquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch inquiries" });
  }
});

// Check inquiry status by email
app.get("/api/inquiries/check", async (req, res) => {
  try {
    const rawEmail = req.query.email;
    if (!rawEmail) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    
    const email = rawEmail.trim();
    // Case-insensitive regex match
    const inquiry = await Inquiry.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } }).sort({ createdAt: -1 });
    
    if (!inquiry) {
      return res.status(200).json({ success: true, status: "None" });
    }

    const chatbotRecord = await Chatbot.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });

    res.status(200).json({ success: true, status: inquiry.status, chatHistory: chatbotRecord ? chatbotRecord.messages : [] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to check inquiry status" });
  }
});

// Add message to chat history
app.put("/api/inquiries/chat", async (req, res) => {
  try {
    const { email, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ success: false, message: "Email and message are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Upsert the chatbot record by case-insensitive matching
    const chatbotRecord = await Chatbot.findOneAndUpdate(
      { email: { $regex: new RegExp(`^${cleanEmail}$`, "i") } },
      { 
        $setOnInsert: { email: cleanEmail },
        $push: { messages: message } 
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: chatbotRecord.messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save chat message" });
  }
});

// Update inquiry status
app.put("/api/inquiries/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Approved", "Declined"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ success: false, message: "Inquiry not found" });
    }

    res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update inquiry status" });
  }
});

const Project = require("./models/Project");

// Get all projects
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch projects" });
  }
});

// Create a new project
app.post("/api/projects", upload.single('image'), async (req, res) => {
  try {
    const projectData = { ...req.body };
    if (req.file) {
      projectData.image = `/uploads/${req.file.filename}`;
    }
    
    // Parse technologies if it comes as a comma-separated string from form-data
    if (typeof projectData.technologies === 'string') {
      try {
        projectData.technologies = JSON.parse(projectData.technologies);
      } catch (e) {
        projectData.technologies = projectData.technologies.split(',').map(t => t.trim());
      }
    }

    const project = await Project.create(projectData);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((item) => item.message);
      return res.status(400).json({ success: false, message: errors[0], errors });
    }
    res.status(500).json({ success: false, message: "Failed to create project" });
  }
});

// Delete a project
app.delete("/api/projects/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    await project.deleteOne();
    res.status(200).json({ success: true, message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete project" });
  }
});

// Update a project
app.put("/api/projects/:id", upload.single('image'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const projectData = { ...req.body };
    if (req.file) {
      projectData.image = `/uploads/${req.file.filename}`;
    }

    if (typeof projectData.technologies === 'string') {
      try {
        projectData.technologies = JSON.parse(projectData.technologies);
      } catch (e) {
        projectData.technologies = projectData.technologies.split(',').map(t => t.trim());
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(req.params.id, projectData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((item) => item.message);
      return res.status(400).json({ success: false, message: errors[0], errors });
    }
    res.status(500).json({ success: false, message: "Failed to update project" });
  }
});

const Admin = require("./models/Admin");
const HomeProfile = require("./models/HomeProfile");

// Multer memory storage for HomeProfile images
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Get home profile (images)
app.get("/api/home-profile", async (req, res) => {
  try {
    let profile = await HomeProfile.findOne();
    if (!profile) {
      profile = await HomeProfile.create({});
    }

    const cleanUrl = (url, fallback) => {
      if (!url) return fallback;
      if (url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, url);
        if (!fs.existsSync(filePath)) return fallback;
      }
      return url;
    };

    const data = {
      smallImage: cleanUrl(profile.smallImage, "/images/project4.jpg"),
      largeImage: cleanUrl(profile.largeImage, "https://tse3.mm.bing.net/th/id/OIP.bA_6zy8pfuPWahLUeHiQhAHaJ4?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"),
      aboutImage: cleanUrl(profile.aboutImage, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"),
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch home profile" });
  }
});

// Update home profile
app.put("/api/home-profile", uploadMemory.fields([
  { name: 'smallImage', maxCount: 1 }, 
  { name: 'largeImage', maxCount: 1 },
  { name: 'aboutImage', maxCount: 1 }
]), async (req, res) => {
  try {
    let profile = await HomeProfile.findOne();
    if (!profile) {
      profile = await HomeProfile.create({});
    }

    if (req.files && req.files.smallImage && req.files.smallImage[0]) {
      const file = req.files.smallImage[0];
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      profile.smallImage = base64;

      // Sync with Admin avatar
      try {
        let admin = await Admin.findOne();
        if (admin) {
          admin.avatar = base64;
          await admin.save();
        }
      } catch (e) {
        console.error("Failed to sync admin avatar", e);
      }
    }
    if (req.files && req.files.largeImage && req.files.largeImage[0]) {
      const file = req.files.largeImage[0];
      profile.largeImage = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }
    if (req.files && req.files.aboutImage && req.files.aboutImage[0]) {
      const file = req.files.aboutImage[0];
      profile.aboutImage = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    await profile.save();
    
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update home profile" });
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
