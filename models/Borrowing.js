import mongoose from 'mongoose';

const borrowingSchema = new mongoose.Schema({
  book: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Book', 
    required: true 
  },
  member: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Member', 
    required: true 
  },
  borrowDate: { type: Date, default: Date.now },
  dueDate: { 
    type: Date, 
    required: true,
    default: function() {
      // Default due date is 2 weeks from borrow date
      const date = new Date();
      date.setDate(date.getDate() + 14);
      return date;
    }
  },
  returnDate: Date,
  status: {
    type: String,
    enum: ['Active', 'Returned', 'Overdue', 'Lost'],
    default: 'Active'
  },
  renewalCount: { type: Number, default: 0 },
  maxRenewals: { type: Number, default: 2 },
  fineAmount: { type: Number, default: 0 },
  notes: String,
  librarian: String // Who processed the borrowing
}, {
  timestamps: true
});

// Index for efficient queries
borrowingSchema.index({ book: 1, member: 1 });
borrowingSchema.index({ status: 1, dueDate: 1 });

// Virtual to check if book is overdue
borrowingSchema.virtual('isOverdue').get(function() {
  return this.status === 'Active' && new Date() > this.dueDate;
});

// Method to calculate fine
borrowingSchema.methods.calculateFine = function() {
  if (this.status !== 'Active' || new Date() <= this.dueDate) {
    return 0;
  }
  
  const daysOverdue = Math.floor((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
  const finePerDay = 0.50; // $0.50 per day
  return daysOverdue * finePerDay;
};

// Method to check if can be renewed
borrowingSchema.methods.canRenew = function() {
  return this.status === 'Active' && 
         this.renewalCount < this.maxRenewals &&
         !this.isOverdue;
};

// Pre-save middleware to update status
borrowingSchema.pre('save', function(next) {
  if (this.isModified('returnDate') && this.returnDate) {
    this.status = 'Returned';
  } else if (this.status === 'Active' && this.isOverdue) {
    this.status = 'Overdue';
    this.fineAmount = this.calculateFine();
  }
  next();
});

// Ensure virtual fields are serialized
borrowingSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Borrowing || mongoose.model('Borrowing', borrowingSchema);