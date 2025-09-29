import mongoose from 'mongoose';

// Simple connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booklibrary';

// Book model
const Book = mongoose.models.Book || mongoose.model('Book', new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Available', 'Borrowed', 'Maintenance'], default: 'Available' },
  description: String
}, { timestamps: true }));

export default async function handler(req, res) {
  // Connect to MongoDB
  if (!mongoose.connections[0].readyState) {
    await mongoose.connect(MONGODB_URI);
  }

  // Handle request
  switch (req.method) {
    case 'GET':
      const books = await Book.find({}).sort({ createdAt: -1 });
      res.json({ success: true, data: books });
      break;
      
    case 'POST':
      const book = await Book.create(req.body);
      res.status(201).json({ success: true, data: book });
      break;
      
    default:
      res.status(405).json({ success: false, error: 'Method not allowed' });
  }
} 