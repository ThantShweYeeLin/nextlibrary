import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true }, // Keep for backward compatibility
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Author' 
  },
  isbn: { type: String, required: true, unique: true },
  categories: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category' 
  }],
  status: { 
    type: String, 
    enum: ['Available', 'Borrowed', 'Maintenance', 'Reserved'], 
    default: 'Available' 
  },
  description: String,
  publishedDate: Date,
  publisher: String,
  pages: Number,
  language: { type: String, default: 'English' },
  edition: String,
  location: {
    section: String,
    shelf: String,
    position: String
  },
  coverImage: String,
  rating: { type: Number, min: 0, max: 5, default: 0 },
  totalCopies: { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
  price: Number,
  condition: {
    type: String,
    enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'],
    default: 'Good'
  }
}, {
  timestamps: true
});

// Index for efficient searching
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ status: 1, categories: 1 });

// Virtual for availability
bookSchema.virtual('isAvailable').get(function() {
  return this.status === 'Available' && this.availableCopies > 0;
});

// Method to update availability when borrowed/returned
bookSchema.methods.updateAvailability = function(action) {
  if (action === 'borrow' && this.availableCopies > 0) {
    this.availableCopies -= 1;
    if (this.availableCopies === 0) {
      this.status = 'Borrowed';
    }
  } else if (action === 'return') {
    this.availableCopies += 1;
    if (this.status === 'Borrowed') {
      this.status = 'Available';
    }
  }
};

// Ensure virtual fields are serialized
bookSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Book || mongoose.model('Book', bookSchema);