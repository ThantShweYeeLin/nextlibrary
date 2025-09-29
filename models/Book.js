import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['Available', 'Borrowed', 'Maintenance'], 
    default: 'Available' 
  },
  description: String
}, {
  timestamps: true
});

export default mongoose.models.Book || mongoose.model('Book', bookSchema);