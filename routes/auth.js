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
  limits: { fileSize: 10 * 1024 * 1024 }
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

// Seed admin user (Runs once)
const seedAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: 'nirpeshdhungel7@gmail.com' });
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
    if (name.toLowerCase() === "nir p esh" || name.toLowerCase() === "nir p esh.") {
      name = "NIRPESH";
      admin.name = "NIRPESH";
      await admin.save();
    }

    res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email,
        name: name,
        avatar: avatar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Admin Profile (name & avatar)
router.put('/profile', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (req.body.name && req.body.name.trim()) {
      admin.name = req.body.name.trim();
    }

    if (req.file) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      admin.avatar = base64Image;

      // Keep HomeProfile smallImage and largeImage in sync
      try {
        let homeProfile = await HomeProfile.findOne();
        if (!homeProfile) {
          homeProfile = await HomeProfile.create({});
        }
        homeProfile.smallImage = base64Image;
        homeProfile.largeImage = base64Image;
        await homeProfile.save();
      } catch (err) {
        console.error("HomeProfile sync error:", err);
      }
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name || "NIRPESH",
        avatar: admin.avatar || ""
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
