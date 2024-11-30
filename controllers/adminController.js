import User from '../models/User.js';
import Book from '../models/Book.js';

export const getStatistics = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    const borrowedBooks = await Book.find({ isBorrowed: true }).countDocuments();
    const mostPopularBooks = await Book.find().sort({ borrowCount: -1 }).limit(5);

    res.status(200).json({
      userCount,
      totalBooks,
      borrowedBooks,
      mostPopularBooks,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching statistics", error });
  }
};

// Fetch all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

// Fetch a user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
};

// Update a user by ID
export const updateUserById = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};
