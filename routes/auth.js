const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Admin = require('../models/Admin');
const HomeProfile = require('../models/HomeProfile');
const PasswordResetAttempt = require('../models/PasswordResetAttempt');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer memory storage for admin avatar (stores Base64 in MongoDB to survive Render restarts)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Seed admin user (Runs once if no admin exists)
const seedAdmin = async () => {
  try {
    const adminExists = await Admin.findOne();
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Nepal123', salt);
      await Admin.create({
        email: 'nirpeshdhungel7@gmail.com',
        password: hashedPassword,
        name: 'NIRPESH',
        avatar: ''
      });
      console.log('Admin user seeded');
    }
  } catch (err) {
    console.error('Failed to seed admin', err);
  }
};
seedAdmin();

// Get Admin Profile
router.get('/profile', async (req, res) => {
  try {
    let admin = null;
    const token = req.header('Authorization')?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        admin = await Admin.findById(decoded.id).select('-password');
      } catch (e) {
        // fallback
      }
    }
    
    if (!admin) {
      admin = await Admin.findOne().select('-password');
    }

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin profile not found' });
    }

    let avatar = admin.avatar || "";
    // If avatar is a legacy /uploads path that no longer exists on Render disk, ignore it
    if (avatar.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', avatar);
      if (!fs.existsSync(filePath)) {
        avatar = "";
      }
    }

    let name = admin.name || "NIRPESH";

    res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email,
        name: name,
        avatar: avatar,
        title: admin.title || "Full Stack Developer",
        bio: admin.bio || "Passionate full-stack developer dedicated to building responsive, scalable, and user-friendly digital experiences.",
        location: admin.location || "Remote / Nepal",
        availability: admin.availability || "Available for new projects",
        github: admin.github || "",
        linkedin: admin.linkedin || "",
        twitter: admin.twitter || "",
        website: admin.website || "",
        phone: admin.phone || "",
        interests: admin.interests && admin.interests.length > 0 ? admin.interests : ["🎮 Gaming", "🎤 Singing", "🎬 Entertainment", "💻 Coding"]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Admin Profile (name, email, avatar, bio, title, location, phone, social links, interests)
router.put('/profile', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (req.body.name && req.body.name.trim()) {
      admin.name = req.body.name.trim();
    }
    if (req.body.email && req.body.email.trim()) {
      admin.email = req.body.email.trim().toLowerCase();
    }
    if (req.body.title !== undefined) {
      admin.title = req.body.title.trim();
    }
    if (req.body.bio !== undefined) {
      admin.bio = req.body.bio.trim();
    }
    if (req.body.location !== undefined) {
      admin.location = req.body.location.trim();
    }
    if (req.body.availability !== undefined) {
      admin.availability = req.body.availability.trim();
    }
    if (req.body.github !== undefined) {
      admin.github = req.body.github.trim();
    }
    if (req.body.linkedin !== undefined) {
      admin.linkedin = req.body.linkedin.trim();
    }
    if (req.body.twitter !== undefined) {
      admin.twitter = req.body.twitter.trim();
    }
    if (req.body.website !== undefined) {
      admin.website = req.body.website.trim();
    }
    if (req.body.phone !== undefined) {
      admin.phone = req.body.phone.trim();
    }
    if (req.body.interests !== undefined) {
      try {
        admin.interests = typeof req.body.interests === 'string'
          ? JSON.parse(req.body.interests)
          : req.body.interests;
      } catch (e) {
        admin.interests = Array.isArray(req.body.interests) ? req.body.interests : [];
      }
    }

    if (req.file) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      admin.avatar = base64Image;
    }

    await admin.save();

    // Ensure all admin records stay synchronized if there's more than 1
    await Admin.updateMany({ _id: { $ne: admin._id } }, {
      name: admin.name,
      email: admin.email,
      avatar: admin.avatar,
      title: admin.title,
      bio: admin.bio,
      location: admin.location,
      availability: admin.availability,
      phone: admin.phone,
      interests: admin.interests,
      github: admin.github,
      linkedin: admin.linkedin,
      twitter: admin.twitter,
      website: admin.website
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name || "NIRPESH",
        avatar: admin.avatar || "",
        title: admin.title || "Full Stack Developer",
        bio: admin.bio || "",
        location: admin.location || "Remote / Nepal",
        availability: admin.availability || "Available for new projects",
        github: admin.github || "",
        linkedin: admin.linkedin || "",
        twitter: admin.twitter || "",
        website: admin.website || "",
        phone: admin.phone || "",
        interests: admin.interests || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ success: true, token, email: admin.email });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify Email for Forgot Password
router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      await PasswordResetAttempt.create({ email: email || 'Unknown', status: 'Failed' });
      return res.status(404).json({ success: false, message: 'Incorrect username or email' });
    }

    res.status(200).json({ success: true, message: 'Email verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all password reset attempts (Protected)
router.get('/reset-attempts', authMiddleware, async (req, res) => {
  try {
    const attempts = await PasswordResetAttempt.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Forgot Password -> Reset (simplified flow as requested)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin with this email not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    admin.password = hashedPassword;
    await admin.save();

    await PasswordResetAttempt.create({ email, status: 'Success' });

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change Password (while logged in)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.adminId);
    
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = { router, authMiddleware };
