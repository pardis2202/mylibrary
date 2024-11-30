import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const router = express.Router();

// Sign-up route
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      profilePicture: "https://via.placeholder.com/100",
      borrowedBooksCount: 0,
      recentlyBorrowed: false,
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(201).json({ message: "User created successfully", token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "An error occurred", details: error.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username (ensure the username is case-insensitive)
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Create the JWT token, including the user's role
    const token = jwt.sign(
      { id: user._id, role: user.role }, // Include the role in the token payload
      process.env.JWT_SECRET, // Ensure this is stored securely in an environment variable
      { expiresIn: "1h" } // Set token expiration (can be adjusted based on your needs)
    );

    // Send the response with the token and the role
    res.json({
      token,            // JWT token for the user
      role: user.role,  // User role (admin, user, etc.)
      message: "Login successful"
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", details: err.message });
  }
});



export default router;




