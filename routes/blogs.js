const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Blog = require("../models/Blog");
const Admin = require("../models/Admin");

const router = express.Router();

// Memory storage for blog cover image (Base64 storage ensures zero broken images on Render restarts)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// Helper: Slugify string
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Helper: Calculate reading time from text
const calculateReadTime = (content) => {
  if (!content) return "1 min read";
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
};

// Seed initial blogs if DB is empty
const seedInitialBlogs = async () => {
  try {
    const count = await Blog.countDocuments();
    if (count === 0) {
      console.log("No blogs found. Seeding initial portfolio blogs...");
      const admin = await Admin.findOne();
      const authorName = admin?.name || "NIRPESH";
      const authorAvatar = admin?.avatar || "";

      const sampleBlogs = [
        {
          title: "Building Modern Full-Stack Web Applications with React & Node.js",
          slug: "building-modern-full-stack-web-applications-react-nodejs",
          excerpt: "A comprehensive guide on architecting scalable, performant, and secure web applications using the modern MERN stack.",
          category: "Full Stack",
          tags: ["React", "Node.js", "Express", "MongoDB", "Architecture"],
          coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80",
          readTime: "5 min read",
          featured: true,
          isPublished: true,
          views: 342,
          author: {
            name: authorName,
            role: "Full Stack Developer",
            avatar: authorAvatar,
          },
          content: `## The Modern Web Landscape

Building full-stack web applications in 2026 demands a strong balance between **developer velocity**, **user experience**, and **system resilience**. Whether you are creating a SaaS dashboard, an interactive portfolio, or a high-throughput API, following proven architectural patterns is vital.

### 1. Clear Separation of Concerns
Maintaining a clean boundary between your client layer and server logic prevents technical debt from accumulating:
* **Frontend:** Focused strictly on presentation, state management, and user interaction.
* **Backend:** Responsible for data validation, business logic, authorization, and secure database persistence.

\`\`\`javascript
// Example: Clean Express route controller pattern
app.post("/api/projects", upload.single("image"), async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
\`\`\`

### 2. Database Resilience and Schema Design
Using MongoDB with Mongoose offers unmatched agility, but schema rigidity must be enforced through code. Always define strict field types, default values, and appropriate database indexes.

> "A great software architecture allows you to defer critical design decisions while keeping the codebase malleable and testable."

### 3. Responsive, Motion-Driven UI
Using modern utilities like Tailwind CSS combined with Framer Motion allows developers to craft fluid, delightful experiences without sacrificing bundle sizes. Remember to keep micro-interactions subtle so the interface feels fast and purposeful.

### Conclusion
Focus on iterative development. Build real working features first, gather feedback, and optimize bottlenecks as your user base grows.`
        },
        {
          title: "Mastering Glassmorphism & Cosmic Dark Themes in Modern UI",
          slug: "mastering-glassmorphism-cosmic-dark-themes-modern-ui",
          excerpt: "Explore the visual design principles, CSS backdrop filters, and radial glow techniques used to create award-winning portfolio experiences.",
          category: "UI/UX Design",
          tags: ["CSS", "Design", "Tailwind", "Frontend", "Glassmorphism"],
          coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80",
          readTime: "4 min read",
          featured: false,
          isPublished: true,
          views: 218,
          author: {
            name: authorName,
            role: "Full Stack Developer",
            avatar: authorAvatar,
          },
          content: `## Why Dark Mode & Glassmorphism Resonate

Modern interfaces have moved past flat, uninspiring grey boxes. Today's most celebrated web designs blend **subtle depth**, **radial ambient glows**, and **frosted glass backdrops** to deliver an immersive atmosphere.

### Core Ingredients of Glassmorphism:
1. **Multi-layered Translucency:** Using subtle alpha backgrounds such as \`bg-slate-900/80\` or \`rgba(255, 255, 255, 0.05)\`.
2. **Backdrop Blur Filter:** Applying \`backdrop-blur-xl\` to blur elements behind the translucent surface.
3. **Subtle Rim Light Borders:** Adding thin 1px borders with low opacity (\`border-white/10\`) to emulate how real glass reflects light at its perimeter.

\`\`\`css
/* Clean Glassmorphic Card Style */
.glass-panel {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}
\`\`\`

### Accessibility & Contrast
Never sacrifice legibility for aesthetics. Always ensure that text maintains at least a 4.5:1 contrast ratio against blurred backgrounds by using high-contrast slate-100 or pure white typography for headings and readable slate-400 for secondary text.`
        },
        {
          title: "Effective State Management & Performance in React 19",
          slug: "effective-state-management-performance-react-19",
          excerpt: "How modern React patterns, concurrent rendering, and clean hook structures simplify application logic while speeding up page transitions.",
          category: "React",
          tags: ["React", "JavaScript", "Performance", "WebDev"],
          coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80",
          readTime: "4 min read",
          featured: false,
          isPublished: true,
          views: 184,
          author: {
            name: authorName,
            role: "Full Stack Developer",
            avatar: authorAvatar,
          },
          content: `## Evolving with Modern React

React continues to simplify front-end engineering by reducing boilerplate while boosting runtime performance. As applications grow, avoiding unnecessary re-renders becomes essential.

### Key Strategies for High Performance:
* **Colocate State:** Keep state as close as possible to the components that need it instead of hoisting everything to the root.
* **Memoize Expensive Calculations:** Leverage \`useMemo\` and \`useCallback\` judiciously when dealing with data transformations or event handlers passed down large component trees.
* **Graceful Transitions:** Pair UI updates with transition animations to make perceived latency practically zero.

\`\`\`javascript
// Efficient filtered list computation
const filteredBlogs = useMemo(() => {
  return blogs.filter((b) => {
    const matchCategory = activeCategory === "All" || b.category === activeCategory;
    const matchSearch = !searchQuery || b.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });
}, [blogs, activeCategory, searchQuery]);
\`\`\`

Stay curious and keep experimenting with modern React features!`
        }
      ];

      await Blog.insertMany(sampleBlogs);
      console.log("Sample blogs successfully seeded into MongoDB!");
    }
  } catch (error) {
    console.error("Failed to seed initial blogs:", error.message);
  }
};

// Execute seed check
seedInitialBlogs();

// ----------------------------------------------------
// 1. GET /api/blogs - List blogs (public or admin)
// ----------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const { status, category, tag, search, featured, limit } = req.query;

    const filter = {};

    // If status is not explicitly "all", only return published blogs
    if (status !== "all") {
      filter.isPublished = true;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (featured === "true") {
      filter.featured = true;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { tags: searchRegex },
        { category: searchRegex },
      ];
    }

    let query = Blog.find(filter).sort({ featured: -1, createdAt: -1 });

    if (limit && !isNaN(Number(limit))) {
      query = query.limit(Number(limit));
    }

    const blogs = await query.lean();

    // Get unique categories with count for filtering UI
    const allBlogsForCategories = await Blog.find(status === "all" ? {} : { isPublished: true }, "category").lean();
    const categoriesMap = {};
    allBlogsForCategories.forEach((b) => {
      if (b.category) {
        categoriesMap[b.category] = (categoriesMap[b.category] || 0) + 1;
      }
    });

    res.status(200).json({
      success: true,
      data: blogs,
      total: blogs.length,
      categories: categoriesMap,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch blogs" });
  }
});

// ----------------------------------------------------
// 2. GET /api/blogs/:slugOrId - Fetch single blog & related
// ----------------------------------------------------
router.get("/:slugOrId", async (req, res) => {
  try {
    const { slugOrId } = req.params;
    let blog = null;

    // Check if slugOrId matches MongoDB ObjectId pattern
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);

    if (isObjectId) {
      blog = await Blog.findById(slugOrId);
    }

    if (!blog) {
      blog = await Blog.findOne({ slug: slugOrId.toLowerCase().trim() });
    }

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    // Fetch up to 3 related published posts
    const relatedPosts = await Blog.find({
      _id: { $ne: blog._id },
      isPublished: true,
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags || [] } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title slug excerpt coverImage category readTime createdAt")
      .lean();

    res.status(200).json({
      success: true,
      data: blog,
      related: relatedPosts,
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    res.status(500).json({ success: false, message: "Failed to load blog post" });
  }
});

// ----------------------------------------------------
// 3. POST /api/blogs - Create new blog (Admin upload)
// ----------------------------------------------------
router.post("/", upload.single("coverImage"), async (req, res) => {
  try {
    const body = req.body || {};
    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      category,
      tags,
      readTime,
      featured,
      isPublished,
      coverImageUrl,
    } = body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }

    // Determine coverImage: either uploaded file buffer (converted to base64 data URI) or provided URL
    let coverImage = coverImageUrl || "";
    if (req.file) {
      const mime = req.file.mimetype || "image/jpeg";
      coverImage = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
    }

    // Generate or sanitize slug
    let finalSlug = customSlug ? generateSlug(customSlug) : generateSlug(title);
    if (!finalSlug) finalSlug = "post-" + Date.now();

    // Ensure unique slug
    let slugExists = await Blog.findOne({ slug: finalSlug });
    if (slugExists) {
      finalSlug = `${finalSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Parse tags
    let parsedTags = [];
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        parsedTags = tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    } else if (Array.isArray(tags)) {
      parsedTags = tags;
    }

    // Auto-calculate read time if missing
    const calculatedReadTime = readTime?.trim() || calculateReadTime(content);

    // Fetch author info from Admin profile if exists
    let author = {
      name: "NIRPESH",
      role: "Full Stack Developer",
      avatar: "",
    };
    try {
      const admin = await Admin.findOne();
      if (admin) {
        author.name = admin.name || "NIRPESH";
        author.avatar = admin.avatar || "";
      }
    } catch (e) {
      // fallback
    }

    const newBlog = await Blog.create({
      title: title.trim(),
      slug: finalSlug,
      excerpt: (excerpt || content.slice(0, 160) + "...").trim(),
      content: content.trim(),
      coverImage: coverImage,
      category: (category || "General").trim(),
      tags: parsedTags,
      readTime: calculatedReadTime,
      author,
      featured: featured === "true" || featured === true,
      isPublished: isPublished === "true" || isPublished === true,
      views: 0,
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: newBlog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "A blog with this slug already exists" });
    }
    res.status(500).json({ success: false, message: error.message || "Failed to create blog" });
  }
});

// ----------------------------------------------------
// 4. PUT /api/blogs/:id - Update blog
// ----------------------------------------------------
router.put("/:id", upload.single("coverImage"), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const body = req.body || {};
    const updates = {};

    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.excerpt !== undefined) updates.excerpt = body.excerpt.trim();
    if (body.content !== undefined) {
      updates.content = body.content.trim();
      if (!body.readTime) {
        updates.readTime = calculateReadTime(updates.content);
      }
    }
    if (body.category !== undefined) updates.category = body.category.trim();
    if (body.readTime !== undefined) updates.readTime = body.readTime.trim();

    if (body.featured !== undefined) {
      updates.featured = body.featured === "true" || body.featured === true;
    }
    if (body.isPublished !== undefined) {
      updates.isPublished = body.isPublished === "true" || body.isPublished === true;
    }

    if (body.slug && body.slug.trim()) {
      const sanitized = generateSlug(body.slug);
      if (sanitized !== blog.slug) {
        const slugExists = await Blog.findOne({ slug: sanitized, _id: { $ne: blog._id } });
        if (slugExists) {
          return res.status(400).json({ success: false, message: "This slug is already taken" });
        }
        updates.slug = sanitized;
      }
    }

    // Cover image update
    if (req.file) {
      const mime = req.file.mimetype || "image/jpeg";
      updates.coverImage = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
    } else if (body.coverImageUrl !== undefined) {
      updates.coverImage = body.coverImageUrl;
    }

    // Tags
    if (body.tags !== undefined) {
      if (typeof body.tags === "string") {
        try {
          updates.tags = JSON.parse(body.tags);
        } catch (e) {
          updates.tags = body.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
      } else if (Array.isArray(body.tags)) {
        updates.tags = body.tags;
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update blog" });
  }
});

// ----------------------------------------------------
// 5. DELETE /api/blogs/:id - Delete blog
// ----------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    await blog.deleteOne();
    res.status(200).json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ success: false, message: "Failed to delete blog" });
  }
});

// ----------------------------------------------------
// 6. PATCH /api/blogs/:id/toggle-publish - Fast toggle
// ----------------------------------------------------
router.patch("/:id/toggle-publish", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    blog.isPublished = !blog.isPublished;
    await blog.save();

    res.status(200).json({
      success: true,
      message: `Blog ${blog.isPublished ? "published" : "moved to drafts"}`,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle publish status" });
  }
});

// ----------------------------------------------------
// 7. PATCH /api/blogs/:id/toggle-featured - Fast toggle
// ----------------------------------------------------
router.patch("/:id/toggle-featured", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    blog.featured = !blog.featured;
    await blog.save();

    res.status(200).json({
      success: true,
      message: `Blog ${blog.featured ? "marked as featured" : "unmarked as featured"}`,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle featured status" });
  }
});

// ----------------------------------------------------
// 8. POST /api/blogs/:id/react - Facebook-style Reactions
// ----------------------------------------------------
router.post("/:id/react", async (req, res) => {
  try {
    const { reactionType, previousReaction } = req.body;
    const validReactions = ["like", "love", "haha", "wow", "sad"];

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    if (!blog.reactions) {
      blog.reactions = { like: 0, love: 0, haha: 0, wow: 0, sad: 0 };
    }

    // Decrement previous reaction if user is changing or removing their reaction
    if (previousReaction && validReactions.includes(previousReaction)) {
      blog.reactions[previousReaction] = Math.max(0, (blog.reactions[previousReaction] || 0) - 1);
    }

    // Increment new reaction if selected
    if (reactionType && validReactions.includes(reactionType)) {
      blog.reactions[reactionType] = (blog.reactions[reactionType] || 0) + 1;
    }

    blog.markModified("reactions");
    await blog.save();

    res.status(200).json({
      success: true,
      message: "Reaction updated",
      reactions: blog.reactions,
    });
  } catch (error) {
    console.error("Error updating reaction:", error);
    res.status(500).json({ success: false, message: "Failed to update reaction" });
  }
});

// ----------------------------------------------------
// 9. POST /api/blogs/:id/comments - Add Comment
// ----------------------------------------------------
router.post("/:id/comments", async (req, res) => {
  try {
    const { name, email, text } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment message is required" });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    // Generate neat avatar URL based on commenter's name
    const encodedName = encodeURIComponent(name.trim());
    const generatedAvatar = `https://ui-avatars.com/api/?name=${encodedName}&background=6366f1&color=fff&bold=true`;

    const newComment = {
      name: name.trim(),
      email: (email || "").trim(),
      text: text.trim(),
      avatar: generatedAvatar,
      createdAt: new Date(),
    };

    blog.comments.unshift(newComment);
    await blog.save();

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: blog.comments[0],
      comments: blog.comments,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, message: "Failed to post comment" });
  }
});

// ----------------------------------------------------
// 10. DELETE /api/blogs/:id/comments/:commentId - Delete Comment
// ----------------------------------------------------
router.delete("/:id/comments/:commentId", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    blog.comments = blog.comments.filter(
      (c) => c._id.toString() !== req.params.commentId
    );
    await blog.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted",
      comments: blog.comments,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ success: false, message: "Failed to delete comment" });
  }
});

// ----------------------------------------------------
// 11. POST /api/blogs/:id/view-google - Unique Viewer Tracking via Google Account
// ----------------------------------------------------
router.post("/:id/view-google", async (req, res) => {
  try {
    const { email, name, avatar } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Google email is required to track unique view" });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!Array.isArray(blog.viewers)) {
      blog.viewers = [];
    }

    const existingViewerIndex = blog.viewers.findIndex(
      (v) => v.email && v.email.toLowerCase() === normalizedEmail
    );

    let isNewViewer = false;

    if (existingViewerIndex === -1) {
      // First time this Google account visits: Register as NEW viewer!
      blog.viewers.push({
        email: normalizedEmail,
        name: (name || "Google User").trim(),
        avatar: avatar || "",
        viewedAt: new Date(),
        lastViewedAt: new Date(),
        timeSpentSeconds: 0,
        viewCount: 1,
      });
      isNewViewer = true;
      // View count strictly equals count of unique Google accounts
      blog.views = blog.viewers.length;
    } else {
      // Returning visitor with the same Gmail account:
      // Do NOT increment views! Just update last active timestamp & visit count
      const existingViewer = blog.viewers[existingViewerIndex];
      existingViewer.lastViewedAt = new Date();
      existingViewer.viewCount = (existingViewer.viewCount || 1) + 1;
      if (name && name !== "Google User") existingViewer.name = name.trim();
      if (avatar) existingViewer.avatar = avatar;
      // Ensure views count is always equal to total unique viewers
      blog.views = blog.viewers.length;
    }

    blog.markModified("viewers");
    await blog.save();

    res.status(200).json({
      success: true,
      message: isNewViewer ? "New unique viewer registered" : "Returning viewer acknowledged (view count not incremented)",
      views: blog.views,
      isNewViewer,
      totalUniqueViewers: blog.viewers.length,
      viewers: blog.viewers,
    });
  } catch (error) {
    console.error("Error tracking Google viewer:", error);
    res.status(500).json({ success: false, message: "Failed to track Google viewer" });
  }
});

// ----------------------------------------------------
// 12. POST /api/blogs/:id/view - Fallback/Anonymous View Count
// ----------------------------------------------------
router.post("/:id/view", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }
    // If viewers exist, keep views equal to unique viewers count
    if (blog.viewers && blog.viewers.length > 0) {
      blog.views = blog.viewers.length;
    } else {
      blog.views = (blog.views || 0) + 1;
    }
    await blog.save();
    res.status(200).json({ success: true, views: blog.views });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to register view" });
  }
});

// ----------------------------------------------------
// 13. POST /api/blogs/:id/reading-time - Dynamic Time Tracking per Viewer & Overall
// ----------------------------------------------------
router.post("/:id/reading-time", async (req, res) => {
  try {
    const { durationSeconds, email } = req.body;
    const seconds = Number(durationSeconds);

    if (isNaN(seconds) || seconds <= 0 || seconds > 7200) {
      return res.status(400).json({ success: false, message: "Invalid duration" });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    // Update global reading analytics
    if (!blog.readingAnalytics) {
      blog.readingAnalytics = { totalReadingSeconds: 0, totalReadingMinutes: 0, readerSessions: 0, avgReadingMinutes: 0 };
    }

    blog.readingAnalytics.totalReadingSeconds =
      (blog.readingAnalytics.totalReadingSeconds || 0) + seconds;
    blog.readingAnalytics.totalReadingMinutes =
      Math.round((blog.readingAnalytics.totalReadingSeconds / 60) * 10) / 10;
    blog.readingAnalytics.readerSessions =
      (blog.readingAnalytics.readerSessions || 0) + 1;

    const avgMinutes =
      (blog.readingAnalytics.totalReadingSeconds / blog.readingAnalytics.readerSessions) / 60;
    blog.readingAnalytics.avgReadingMinutes = Math.max(0.1, Math.round(avgMinutes * 10) / 10);

    // If specific viewer's email was provided, also attribute reading time to viewer's profile
    if (email && Array.isArray(blog.viewers)) {
      const normalizedEmail = email.trim().toLowerCase();
      const viewer = blog.viewers.find(
        (v) => v.email && v.email.toLowerCase() === normalizedEmail
      );
      if (viewer) {
        viewer.timeSpentSeconds = (viewer.timeSpentSeconds || 0) + seconds;
        viewer.lastViewedAt = new Date();
        blog.markModified("viewers");
      }
    }

    blog.markModified("readingAnalytics");
    await blog.save();

    res.status(200).json({
      success: true,
      analytics: blog.readingAnalytics,
    });
  } catch (error) {
    console.error("Error tracking reading time:", error);
    res.status(500).json({ success: false, message: "Failed to record reading time" });
  }
});

module.exports = router;

