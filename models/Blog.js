const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    default: "",
    trim: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  text: {
    type: String,
    required: [true, "Comment text is required"],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const viewerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Viewer email is required"],
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    default: "Google User",
    trim: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  viewedAt: {
    type: Date,
    default: Date.now,
  },
  lastViewedAt: {
    type: Date,
    default: Date.now,
  },
  timeSpentSeconds: {
    type: Number,
    default: 0,
  },
  viewCount: {
    type: Number,
    default: 1,
  },
});

const userReactionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Reactor email is required"],
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    default: "Google User",
    trim: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  reactionType: {
    type: String,
    enum: ["like", "love", "haha", "wow", "sad"],
    required: true,
  },
  reactedAt: {
    type: Date,
    default: Date.now,
  },
});

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      required: [true, "Excerpt/summary is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Blog content is required"],
    },
    coverImage: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "Web Development",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    readTime: {
      type: String,
      default: "3 min read",
    },
    author: {
      name: {
        type: String,
        default: "NIRPESH",
      },
      role: {
        type: String,
        default: "Full Stack Developer",
      },
      avatar: {
        type: String,
        default: "",
      },
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    // Facebook-style reactions
    reactions: {
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      haha: { type: Number, default: 0 },
      wow: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
    },
    // User reactions tied to Google accounts
    reactionsList: [userReactionSchema],
    // Comments list
    comments: [commentSchema],
    // Unique Google viewers list
    viewers: [viewerSchema],
    // Dynamic reading time analytics
    readingAnalytics: {
      totalReadingSeconds: { type: Number, default: 0 },
      totalReadingMinutes: { type: Number, default: 0 },
      readerSessions: { type: Number, default: 0 },
      avgReadingMinutes: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast published blogs lookup
blogSchema.index({ isPublished: 1, createdAt: -1 });

module.exports = mongoose.model("Blog", blogSchema);
