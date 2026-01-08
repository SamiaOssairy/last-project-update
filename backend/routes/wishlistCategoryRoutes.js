const express = require('express');
const { protect, restrictTo } = require('../controllers/AuthController');
const {
  createWishlistCategory,
  getAllWishlistCategories,
  updateWishlistCategory,
  deleteWishlistCategory
} = require('../controllers/WishlistCategoryController');

const wishlistCategoryRouter = express.Router();

wishlistCategoryRouter.use(protect);

wishlistCategoryRouter.get('/', getAllWishlistCategories);
wishlistCategoryRouter.post('/', restrictTo('Parent'), createWishlistCategory);
wishlistCategoryRouter.patch('/:categoryId', restrictTo('Parent'), updateWishlistCategory);
wishlistCategoryRouter.delete('/:categoryId', restrictTo('Parent'), deleteWishlistCategory);

module.exports = wishlistCategoryRouter;
