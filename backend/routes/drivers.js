const express = require('express');
const router = express.Router();
const {
    getDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
    resetDriverPassword
} = require('../controllers/driverController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getDrivers)
    .post(protect, admin, createDriver);

router.route('/:id')
    .put(protect, admin, updateDriver)
    .delete(protect, admin, deleteDriver);

router.route('/:id/reset-password')
    .put(protect, admin, resetDriverPassword);

module.exports = router;
