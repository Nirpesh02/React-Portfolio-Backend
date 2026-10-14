require("dotenv").config();
const mongoose = require("mongoose");
const Blog = require("./models/Blog");

const resetAll = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const result = await Blog.updateMany(
      {},
      {
        $set: {
          views: 0,
          viewers: [],
          reactions: { like: 0, love: 0, haha: 0, wow: 0, sad: 0 },
          comments: [],
          readingAnalytics: {
            totalReadingSeconds: 0,
            totalReadingMinutes: 0,
            readerSessions: 0,
            avgReadingMinutes: 0,
          },
        },
      }
    );

    console.log(`Reset successful! Modified ${result.modifiedCount} blogs.`);
    const blogs = await Blog.find({}, "title views viewers reactions comments readingAnalytics");
    console.log("Updated Blogs Summary:", JSON.stringify(blogs, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error resetting stats:", error);
    process.exit(1);
  }
};

resetAll();
