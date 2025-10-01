import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  membershipType: {
    type: String,
    enum: ['Basic', 'Premium', 'Student', 'Senior'],
    default: 'Basic'
  },
  membershipStatus: {
    type: String,
    enum: ['Active', 'Suspended', 'Expired', 'Pending'],
    default: 'Active'
  },
  joinDate: { type: Date, default: Date.now },
  expiryDate: Date,
  maxBooksAllowed: { type: Number, default: 5 },
  currentBooksCount: { type: Number, default: 0 },
  fines: { type: Number, default: 0 },
  notes: String
}, {
  timestamps: true
});

// Virtual for full name
memberSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check if member can borrow more books
memberSchema.methods.canBorrowBooks = function() {
  return this.membershipStatus === 'Active' && 
         this.currentBooksCount < this.maxBooksAllowed &&
         this.fines === 0;
};

// Ensure virtual fields are serialized
memberSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Member || mongoose.model('Member', memberSchema);