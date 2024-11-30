import express from 'express';
import Book from '../models/Book.js';
import NonFictionBook from '../models/NonFictionBook.js';

const router = express.Router();

router.get('/search', async (req, res) => {
  const query = req.query.query;

  // Check if the query exists
  if (!query) {
    return res.status(400).json({ message: "Search query is required" });
  }

  // Log the search query to debug
  console.log('Search Query:', query);

  // Split query into words and join with '|' for OR condition, making it case-insensitive
  const regexQuery = query.split(' ').join('|');  // 'romeo and juliet' => 'romeo|and|juliet'

  // Log the regexQuery to debug
  console.log('Regex Query:', regexQuery);

  try {
    // Search both Book and NonFictionBook collections
    const [fictionBooks, nonFictionBooks] = await Promise.all([
      Book.find({ title: { $regex: regexQuery, $options: 'i' } }),       // Case-insensitive search for fiction books
      NonFictionBook.find({ title: { $regex: regexQuery, $options: 'i' } })  // Case-insensitive search for non-fiction books
    ]);

    // Combine the results from both collections
    const results = [...fictionBooks, ...nonFictionBooks];

    // Log the results to ensure they are being fetched correctly
    console.log('Search Results:', results);

    // Send the results as a JSON response
    res.json(results);  
  } catch (error) {
    console.error("Error searching books:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;

