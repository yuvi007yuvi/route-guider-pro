const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
    getRoutes,
    createRoute,
    createBulkRoutes,
    uploadCsvRoutes,
    getRouteById,
    updateRoute,
    deleteRoute,
    assignRoute,
    getAssignedRoutes,
    getAllAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
} = require('../controllers/routeController');
const { completeRoute } = require('../controllers/progressController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getRoutes)
    .post(protect, admin, createRoute);

router.route('/bulk')
    .post(protect, admin, createBulkRoutes);

router.route('/upload-csv')
    .post(protect, admin, upload.single('file'), uploadCsvRoutes);

router.route('/assign')
    .post(protect, admin, assignRoute);

router.route('/complete')
    .post(protect, completeRoute);

router.route('/assigned/:driverId')
    .get(protect, getAssignedRoutes);

router.route('/assignments/all')
    .get(protect, admin, getAllAssignments);

router.route('/assignment/:id')
    .get(protect, getAssignmentById)
    .put(protect, admin, updateAssignment)
    .delete(protect, admin, deleteAssignment);

router.route('/:id')
    .get(protect, admin, getRouteById)
    .put(protect, admin, updateRoute)
    .delete(protect, admin, deleteRoute);

module.exports = router;
