const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { addFavorite, getFavorites, removeFavorite } = require('../controllers/favoriteController');

router.use(protect);

router.post('/', addFavorite);
router.get('/', getFavorites);
router.delete('/:itemType/:itemId', removeFavorite);

module.exports = router;
