const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  wishlist_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wishlist',
    required: [true, 'Please provide the wishlist ID']
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WishlistCategory',
    required: [true, 'Please provide a category ID']
  },
  item_name: {
    type: String,
    required: [true, 'Please provide the item name']
  },
  required_points: {
    type: Number,
    required: [true, 'Please provide the required points'],
    min: [0, 'Required points cannot be negative']
  },
  assigned_by: {
    type: String,
    required: [true, 'Please provide who assigned the item'],
    ref: 'Member'
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'redeemed', 'removed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
wishlistItemSchema.index({ wishlist_id: 1, status: 1 });
wishlistItemSchema.index({ category_id: 1 });

const WishlistItem = mongoose.model('WishlistItem', wishlistItemSchema);

module.exports = WishlistItem;
