import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import booksRouter from "./routes/books.js";
import blogPostsRouter from "./routes/blogpost.js";
import contactRouter from "./routes/contact.js";
import protectedRouter from "./routes/protectedRouter.js";
import Book from "./models/Book.js";
import User from "./models/User.js";
import NonFictionBook from "./models/NonFictionBook.js";
import authRoutes from './routes/auth.js';
import nonfictionBooksRouter from './routes/nonfictionBooksRouter.js';
import authMiddleware from "./middleware/authMiddleware.js";
import jwt from 'jsonwebtoken';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Ensure the 'uploads' directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
  // Check if the user's role is 'admin'
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied, not an admin' });
  }
  next(); // Proceed if the user is an admin
};

// Endpoint for uploading PDFs and creating a new book entry
app.post('/uploads', upload.single('pdf'), verifyAdmin, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const pdfUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  const newBook = new Book({
    title: req.body.title,
    author: req.body.author,
    description: req.body.description,
    pages: req.body.pages,
    available: req.body.available,
    image: req.body.image,
    comments: req.body.comments,
    pdfUrl: pdfUrl
  });

  try {
    await newBook.save();
    res.json({ pdfUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save book', details: error.message });
  }
});

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static('uploads'));

// Define API routes
app.use("/api/books", booksRouter);
app.use("/api/nonfiction", nonfictionBooksRouter);
app.use("/api/blog-posts", blogPostsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/protected-route", protectedRouter);
app.use('/api/auth', authRoutes);
app.use("/api/user", userRoutes);
app.use('/admin', authMiddleware, verifyAdmin, adminRoutes);

// Basic endpoint to confirm server is running
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Search endpoint
app.get("/api/search", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const regexQuery = new RegExp(query, "i");

    // Search in both fiction and non-fiction books
    const fictionBooks = await Book.find({ title: { $regex: regexQuery } });
    const nonFictionBooks = await NonFictionBook.find({ title: { $regex: regexQuery } });

    // Combine the results from both collections
    const results = [...fictionBooks, ...nonFictionBooks];

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while searching for books", details: error.message });
  }
});

// Endpoint to get all books, ensuring full URLs for PDFs are returned
app.get('/api/books', verifyAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const books = await Book.find().skip(skip).limit(limit);
    const totalBooks = await Book.countDocuments();

    const booksWithFullUrls = books.map(book => ({
      ...book.toObject(),
      pdfUrl: `${req.protocol}://${req.get('host')}/uploads/${book.pdfUrl}`,
    }));

    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      books: booksWithFullUrls,
      totalBooks,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books', details: error.message });
  }
});

// Fetch non-fiction books
app.get('/api/nonfiction', verifyAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalBooks = await NonFictionBook.countDocuments();

    const nonfictionBooks = await NonFictionBook.find().skip(skip).limit(limit);

    const booksWithFullUrls = nonfictionBooks.map(book => ({
      ...book.toObject(),
      pdfUrl: `${req.protocol}://${req.get('host')}/uploads/${book.pdfUrl}`,
    }));

    res.json({
      books: booksWithFullUrls,
      totalPages: Math.ceil(totalBooks / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch non-fiction books', details: error.message });
  }
});

// Get details of a book by ID
app.get('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  const book = await Book.findById(id);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  res.json(book);
});

// Get details of a non-fiction book by ID
app.get('/api/nonfiction/:id', async (req, res) => {
  const { id } = req.params;
  const book = await NonFictionBook.findById(id);
  if (!book) {
    return res.status(404).json({ message: "Non-fiction book not found" });
  }
  res.json(book);
});

// Profile endpoint to retrieve user data
app.get('/api/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const borrowedBooks = user.borrowedBooks || [];

    res.json({
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      borrowedBooksCount: borrowedBooks.length,
      borrowedBooks,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, role: user.role });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Set the port from environment or fallback to 5000
const PORT = 5000;

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});




