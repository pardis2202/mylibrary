import express from "express";
import authMiddleware from "../middleware/authMiddleware.js"; // Adjust path if needed
const router = express.Router();

// Example protected route
router.get("/", authMiddleware, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

export default router;
