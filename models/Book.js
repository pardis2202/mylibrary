import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: { type: String},         // Title is optional
  author: { type: String},        // Author is optional
  description: { type: String },   // Description is optional
  pages: { type: Number},         // Pages is optional
  available: { type: Boolean},      // Default to true
  image: { type: String},         // Image URL is optional
  pdfUrl: { type: String},         // PDF is required for non-fiction books
  borrowed: { type: Boolean, default: false }, // Track if the book is borrowed
  borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // User who borrowed the book
  borrowedDate: { type: Date, default: null },
  comments: [
    {
      user: String,
      text: String,
      date: { type: Date, default: Date.now },
    },
  ],
  genre: { type: String, default: 'fiction' },          // Genre is required (non-fiction in this case)
});

const Book = mongoose.model('Book', bookSchema);

export default Book;



