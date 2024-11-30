import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema({
  title: String,
  date: String,
  author: String,
  summary: String,
  image: String,
});

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

export default BlogPost;

