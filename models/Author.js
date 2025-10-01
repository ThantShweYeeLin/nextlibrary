import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  biography: String,
  birthDate: Date,
  nationality: String,
  website: String,
  socialMedia: {
    twitter: String,
    instagram: String,
    facebook: String
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Virtual for full name
authorSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
authorSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Author || mongoose.model('Author', authorSchema);