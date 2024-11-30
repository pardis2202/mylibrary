import express from 'express';
import NonFictionBook from '../models/NonFictionBook.js';

const router = express.Router();

// Route to get all non-fiction books
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 books per page
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  try {
    // Fetch the total count of nonfiction books for calculating total pages
    const totalBooks = await NonFictionBook.countDocuments({ genre: "Non-Fiction" });

    // Fetch the nonfiction books with pagination
    const nonfictionBooks = await NonFictionBook.find({ genre: "Non-Fiction" })
      .skip(skip)
      .limit(limit);

    res.json({
      books: nonfictionBooks, // Books for the current page
      totalPages: Math.ceil(totalBooks / limit), // Total pages
      currentPage: page, // Current page
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch non-fiction books", details: error.message });
  }
});

// Route to borrow a book
router.patch("/:id/borrow", async (req, res) => {
  try {
    const { id } = req.params;
    const book = await NonFictionBook.findById(id);

    if (!book) {
      return res.status(404).json({ message: "Non-Fiction book not found" });
    }

    // Check if the book is already borrowed
    if (book.borrowed) {
      return res.status(400).json({ message: "This book is already borrowed" });
    }

    // Mark the book as borrowed
    book.borrowed = true;
    await book.save();
    res.json({ message: "Book borrowed successfully", book });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to return a book
router.patch("/:id/return", async (req, res) => {
  try {
    const { id } = req.params;
    const book = await NonFictionBook.findById(id);

    if (!book) {
      return res.status(404).json({ message: "Non-Fiction book not found" });
    }

    // Check if the book is already returned
    if (!book.borrowed) {
      return res.status(400).json({ message: "This book is already returned" });
    }

    // Mark the book as available again
    book.borrowed = false;
    await book.save();
    res.json({ message: "Book returned successfully", book });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST route for uploading a new non-fiction book
router.post("/", async (req, res) => {
  try {
    const newBook = new NonFictionBook(req.body);
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH route to update an existing non-fiction book
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBook = await NonFictionBook.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(updatedBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT route to replace an existing non-fiction book
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBook = await NonFictionBook.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(updatedBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE route to delete a non-fiction book
router.delete("/:id", async (req, res) => {
  try {
    const book = await NonFictionBook.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific non-fiction book by ID
router.get("/:id", async (req, res) => {
  try {
    const book = await NonFictionBook.findById(req.params.id); 
    if (!book) {
      return res.status(404).json({ message: "Non-Fiction book not found" });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


