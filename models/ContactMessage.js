import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
});

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

export default ContactMessage;
