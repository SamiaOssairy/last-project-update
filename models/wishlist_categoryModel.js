const mongoose = require('mongoose');

const wishlistCategorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide the category title']
  },
  description: {
    type: String,
    default: ''
  },
  family_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyAccount',
    required: [true, 'Please provide a family account ID']
  }
}, {
  timestamps: true
});

// Create compound index: category title must be unique per family
wishlistCategorySchema.index({ title: 1, family_id: 1 }, { unique: true });

const WishlistCategory = mongoose.model('WishlistCategory', wishlistCategorySchema);

module.exports = WishlistCategory;
