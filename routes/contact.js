import express from 'express';
import ContactMessage from '../models/ContactMessage.js';

const router = express.Router();

// Add a new contact message
router.post("/", async (req, res) => {
  const contactMessage = new ContactMessage(req.body);
  try {
    const newMessage = await contactMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;

