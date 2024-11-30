import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String }, // URL for user profile picture
  borrowedBooksCount: { type: Number, default: 0 },
  lastBorrowedAt: { type: Date },
  role: {
    type: String,
    enum: ["user", "admin"], // Role options
    default: "user",
  },
});

const User = mongoose.model('User', userSchema);

export default User;

