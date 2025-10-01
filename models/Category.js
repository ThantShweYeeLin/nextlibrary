import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  parentCategory: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    default: null 
  },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  color: { type: String, default: '#3B82F6' }, // For UI purposes
  icon: String // Icon name or emoji for UI
}, {
  timestamps: true
});

// Method to get all subcategories
categorySchema.methods.getSubcategories = function() {
  return this.model('Category').find({ parentCategory: this._id });
};

// Static method to get category hierarchy
categorySchema.statics.getCategoryTree = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $graphLookup: {
        from: 'categories',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parentCategory',
        as: 'subcategories'
      }
    },
    { $match: { parentCategory: null } },
    { $sort: { sortOrder: 1, name: 1 } }
  ]);
};

export default mongoose.models.Category || mongoose.model('Category', categorySchema);