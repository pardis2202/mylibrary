import mongoose from 'mongoose';

const NonFictionBookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String, default: 'Non-Fiction' },  // Defaults to "Non-Fiction"
  description: { type: String },   // Description is optional
  pages: { type: Number},         // Pages is optional
  available: { type: Boolean, required:true},      // Default to true
  image: { type: String},         // Image URL is optional   
  pdfUrl: { type: String },
  borrowed: { type: Boolean, default: false }, // Track if the book is borrowed
  borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // User who borrowed the book
  borrowedDate: { type: Date, default: null },
  comments: [
    {
      user: String,
      text: String,
      date: { type: Date, default: Date.now },
    },
  ]
});

const NonFictionBook = mongoose.model('NonFictionBook', NonFictionBookSchema, 'nonfictionBooks');  // Explicitly name the collection

export default NonFictionBook;
