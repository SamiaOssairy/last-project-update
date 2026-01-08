const express = require('express');
const { protect, restrictTo } = require('../controllers/AuthController');
const {
  getMyWishlist,
  getMemberWishlist,
  addWishlistItem,
  addWishlistItemToMember,
  updateWishlistItem,
  prioritizeWishlistItems,
  removeWishlistItem,
  getWishlistProgress
} = require('../controllers/WishlistController');

const wishlistRouter = express.Router();

wishlistRouter.use(protect);

// My wishlist
wishlistRouter.get('/my-wishlist', getMyWishlist);
wishlistRouter.get('/my-wishlist/progress', getWishlistProgress);
wishlistRouter.post('/my-wishlist/items', addWishlistItem);
wishlistRouter.patch('/my-wishlist/prioritize', prioritizeWishlistItems);

// Wishlist items management
wishlistRouter.patch('/items/:itemId', updateWishlistItem);
wishlistRouter.delete('/items/:itemId', removeWishlistItem);

// Parent can view any member's wishlist and add items to it
wishlistRouter.get('/:memberMail', getMemberWishlist);
wishlistRouter.post('/:memberMail/items', restrictTo('Parent'), addWishlistItemToMember);

module.exports = wishlistRouter;
