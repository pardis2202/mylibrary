import express from 'express';
import BlogPost from '../models/BlogPost.js';

const router = express.Router();

// Get all blog posts
router.get("/", async (req, res) => {
  try {
    const blogPosts = await BlogPost.find();
    res.json(blogPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new blog post
router.post("/", async (req, res) => {
  const blogPost = new BlogPost(req.body);
  try {
    const newBlogPost = await blogPost.save();
    res.status(201).json(newBlogPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;

