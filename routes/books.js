import express from 'express';
import Book from '../models/Book.js';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Get all books with pagination
// Get all books with pagination
router.get("/", async (req, res) => {
  try {
    // Extract page and limit from query parameters, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log('Page:', page, 'Limit:', limit);  // Log the received parameters

    // Fetch the paginated books
    const books = await Book.find().skip((page - 1) * limit).limit(limit);
    console.log('Fetched books:', books); // Log the fetched books

    // Total count of books
    const totalBooks = await Book.countDocuments();
    console.log('Total books:', totalBooks);  // Log the total books count

    // Format books with full URLs (if PDF URLs are included)
    const booksWithFullUrls = books.map((book) => ({
      ...book.toObject(),
      pdfUrl: `${req.protocol}://${req.get("host")}/uploads/${book.pdfUrl}`,
    }));

    // Calculate total pages
    const totalPages = Math.ceil(totalBooks / limit);

    // Send the response
    res.json({
      books: booksWithFullUrls,
      totalBooks,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: "Failed to fetch books", details: error.message });
  }
});


// Borrow a book (user authentication required)
router.patch("/:id/borrow", authMiddleware, async (req, res) => {
  const { userId } = req.user; // Get user ID from the JWT token
  const bookId = req.params.id;

  try {
    // Find the book and check if it's already borrowed
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.borrowed) {
      return res.status(400).json({ message: "Book is already borrowed" });
    }

    // Mark the book as borrowed
    book.borrowed = true;
    book.borrowedBy = userId;
    book.borrowedDate = new Date();

    await book.save();

    // Update user's borrowedBooks array
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.borrowedBooks.push({ bookId, borrowDate: new Date() });
    await user.save();

    res.status(200).json({ message: "Book borrowed successfully", book });
  } catch (error) {
    res.status(500).json({ message: "Error borrowing book", details: error.message });
  }
});

// Return a book
router.patch("/:id/return", authMiddleware, async (req, res) => {
  const { userId } = req.user; // Get user ID from the JWT token
  const bookId = req.params.id;

  try {
    // Find the book and check if it's borrowed
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!book.borrowed || book.borrowedBy.toString() !== userId) {
      return res.status(400).json({ message: "Book is not currently borrowed by you" });
    }

    // Mark the book as returned
    book.borrowed = false;
    book.borrowedBy = null;
    book.borrowedDate = null;

    await book.save();

    // Remove the book from user's borrowedBooks array
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.borrowedBooks = user.borrowedBooks.filter(
      (borrowedBook) => borrowedBook.bookId.toString() !== bookId
    );
    await user.save();

    res.status(200).json({ message: "Book returned successfully", book });
  } catch (error) {
    res.status(500).json({ message: "Error returning book", details: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBook = await Book.findByIdAndUpdate(id, req.body, {
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

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBook = await Book.findByIdAndUpdate(id, req.body, {
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
router.post("/", async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id); 
    if (!book) {
      return res.status(404).json({ message: "Non-Fiction book not found" });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


