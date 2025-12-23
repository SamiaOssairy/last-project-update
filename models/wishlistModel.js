const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  member_mail: {
    type: String,
    required: [true, 'Please provide the member email'],
    unique: true,
    ref: 'Member'
  },
  title: {
    type: String,
    default: 'My Wishlist'
  }
}, {
  timestamps: true
});

// Index for faster lookups
wishlistSchema.index({ member_mail: 1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
