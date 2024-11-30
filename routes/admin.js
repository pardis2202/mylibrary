import express from "express";
import bcrypt from 'bcryptjs';
import adminMiddleware from "../middleware/adminMiddleware.js";
import { getAllUsers, deleteUser } from '../controllers/adminController.js';
import User from '../models/User.js';
import Book from '../models/Book.js';

const router = express.Router();

router.use("/admin", adminMiddleware.adminAuth, adminMiddleware.isAdmin);

router.get('/statistics', async (req, res) => {
    try {
        const totalBooks = await Book.countDocuments();
        const totalUsers = await User.countDocuments();
        res.json({ totalBooks, totalUsers });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching statistics', details: error.message });
    }
});

router.post('/books', async (req, res) => {
    const { title, author, description, genre } = req.body;
    try {
        const newBook = new Book({ title, author, description, genre });
        await newBook.save();
        res.status(201).json(newBook);
    } catch (error) {
        res.status(500).json({ error: 'Error adding book', details: error.message });
    }
});

router.delete('/books/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Book.findByIdAndDelete(id);
        res.status(200).json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting book', details: error.message });
    }
});

router.post('/nonfiction', async (req, res) => {
    const { title, author, description } = req.body;
    try {
        const newNonFictionBook = new Book({ title, author, description, genre: 'Non-Fiction' });
        await newNonFictionBook.save();
        res.status(201).json(newNonFictionBook);
    } catch (error) {
        res.status(500).json({ error: 'Error adding non-fiction book', details: error.message });
    }
});

router.delete('/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await User.findByIdAndDelete(id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user', details: error.message });
    }
});

router.post('/create-admin', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin user
        const adminUser = new User({
            username,
            email,
            password: hashedPassword, // Store hashed password
            role: 'admin', // Assign 'admin' role
        });

        await adminUser.save();
        res.status(201).json({ message: 'Admin user created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating admin user', details: error.message });
    }
});

// Admin-specific routes
router.get("/users", getAllUsers);
router.delete("/user/:id", deleteUser);

export default router;
