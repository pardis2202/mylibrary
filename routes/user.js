import express from "express";
import bcrypt from 'bcryptjs';
import multer from "multer";
import path from "path";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer storage for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve("uploads/profile-pictures");
    cb(null, uploadPath); // Specify folder for saving profile pictures
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Rename file with timestamp for uniqueness
  },
});

// Multer middleware for file uploads
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB size limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, and GIF formats are allowed."));
    }
    cb(null, true);
  },
});

// Profile update route with file upload
router.put("/profile", authMiddleware, upload.single("profilePicture"), async (req, res) => {
  const { borrowedBooksCount, recentlyBorrowed } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update profile fields
    if (req.file) {
      const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;
      user.profilePicture = profilePictureUrl; // Update profile picture URL
    }

    user.borrowedBooksCount = borrowedBooksCount || user.borrowedBooksCount;
    user.recentlyBorrowed = recentlyBorrowed || user.recentlyBorrowed;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Error updating profile", details: error.message });
  }
});

// Get profile data
router.get("/profile", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).populate('borrowedBooks.bookId'); // Populate book details if needed
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user has borrowed any books in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Filter borrowed books to see if there are any within the last week
    const recentlyBorrowedBooks = user.borrowedBooks.filter(borrowedBook => {
      return new Date(borrowedBook.borrowDate) > oneWeekAgo;
    });

    // Determine if the user has borrowed books in the last week
    const recentlyBorrowed = recentlyBorrowedBooks.length > 0;

    res.status(200).json({
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      borrowedBooksCount: user.borrowedBooksCount || 0,
      recentlyBorrowed,
      recentlyBorrowedBooks: recentlyBorrowedBooks.map(borrowedBook => ({
        bookId: borrowedBook.bookId._id,  // Book ID
        title: borrowedBook.bookId.title, // Assuming book has title field
        borrowDate: borrowedBook.borrowDate
      })),
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Failed to fetch user data", details: error.message });
  }
});

// Get a user by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user details", error });
  }
});

// Update user by ID (admin only or self update)
router.put("/:id", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const updatedData = req.body;

  if (userId !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: "You are not authorized to update this user" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating user details", error });
  }
});

// User registration
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = new User({
      username: username.toLowerCase(),
      email,
      password: hashedPassword,
      role: role || 'user', 
    });

    // Save user to database
    await newUser.save();

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update username
router.patch("/register", async (req, res) => {
  const { currentUsername, newUsername } = req.body;

  try {
    // Find the user by their current username
    const user = await User.findOne({ username: currentUsername });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the username to the new one (ensuring it's lowercase)
    user.username = newUsername.toLowerCase(); // Normalize to lowercase
    await user.save();

    res.json({
      message: "Username updated successfully",
      updatedUsername: user.username,
    });
  } catch (err) {
    console.error("Error updating username:", err);
    res.status(500).json({ message: "Server error", details: err.message });
  }
});

// Admin route (for testing admin role)
router.get("/admin", authMiddleware, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  res.status(200).json({ message: "Welcome, admin!" });
});

export default router;


