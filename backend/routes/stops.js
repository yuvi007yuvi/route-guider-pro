const express = require('express');
const router = express.Router();
const { completeStop } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.route('/complete')
    .post(protect, completeStop);

module.exports = router;
