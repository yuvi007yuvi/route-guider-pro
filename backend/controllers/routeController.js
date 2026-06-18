const Route = require('../models/Route');
const RouteStop = require('../models/RouteStop');
const RouteAssignment = require('../models/RouteAssignment');
const csv = require('csv-parser');
const streamifier = require('streamifier');

// @desc    Get all routes
// @route   GET /api/routes
// @access  Private/Admin
const getRoutes = async (req, res) => {
    try {
        const routes = await Route.find({});
        res.json(routes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a new route with stops
// @route   POST /api/routes
// @access  Private/Admin
const createRoute = async (req, res) => {
    const { routeName, description, stops } = req.body;

    try {
        const route = await Route.create({
            routeName,
            description,
            totalStops: stops ? stops.length : 0,
        });

        if (stops && stops.length > 0) {
            const stopPromises = stops.map((stop, index) => {
                return RouteStop.create({
                    routeId: route._id,
                    stopName: stop.stopName,
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                    sequenceNumber: index + 1,
                });
            });
            await Promise.all(stopPromises);
        }

        res.status(201).json(route);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create bulk routes
// @route   POST /api/routes/bulk
// @access  Private/Admin
const createBulkRoutes = async (req, res) => {
    // Expecting req.body to be an array of route objects:
    // [{ routeName: 'A', description: '...', stops: [{stopName: 'X', latitude: 1, longitude: 1, sequenceNumber: 1}] }]
    const routesData = req.body;

    if (!Array.isArray(routesData) || routesData.length === 0) {
        return res.status(400).json({ message: 'Invalid data format. Expected an array of routes.' });
    }

    try {
        const createdRoutes = [];

        for (const routeData of routesData) {
            const route = await Route.create({
                routeName: routeData.routeName,
                description: routeData.description,
                totalStops: routeData.stops ? routeData.stops.length : 0,
            });

            if (routeData.stops && routeData.stops.length > 0) {
                const stopPromises = routeData.stops.map((stop) => {
                    return RouteStop.create({
                        routeId: route._id,
                        stopName: stop.stopName,
                        latitude: stop.latitude,
                        longitude: stop.longitude,
                        sequenceNumber: stop.sequenceNumber || stop.Sequence || stop.sequence || 1,
                    });
                });
                await Promise.all(stopPromises);
            }
            createdRoutes.push(route);
        }

        res.status(201).json({ message: `${createdRoutes.length} routes imported successfully`, routes: createdRoutes });
    } catch (error) {
        res.status(500).json({ message: 'Server error during bulk insert', error: error.message });
    }
};

// @desc    Upload CSV Routes
// @route   POST /api/routes/upload-csv
// @access  Private/Admin
const uploadCsvRoutes = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    streamifier.createReadStream(req.file.buffer)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                for (const row of results) {
                    const ward = row['Ward Area'];
                    const routeId = row['Route ID'];
                    const routeName = row['Route Name'];
                    const routeType = row['Route Type'];
                    const kmlContent = row['KML Content'];

                    if (!routeName || !kmlContent) {
                        continue;
                    }

                    // Check if route exists to prevent unique ID errors
                    const existingRoute = await Route.findOne({ routeId });
                    if (existingRoute) {
                        errorCount++;
                        continue; // Skip existing
                    }

                    const coordMatch = kmlContent.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
                    let stopsData = [];
                    if (coordMatch && coordMatch[1]) {
                        const rawCoords = coordMatch[1].trim();
                        const points = rawCoords.split(/\s+/);
                        
                        points.forEach((point, index) => {
                            if (!point) return;
                            const [lng, lat] = point.split(',');
                            if (lng && lat) {
                                stopsData.push({
                                    stopName: `Stop ${index + 1}`,
                                    latitude: parseFloat(lat),
                                    longitude: parseFloat(lng),
                                    sequenceNumber: index + 1
                                });
                            }
                        });
                    }

                    const route = await Route.create({
                        routeId,
                        routeName,
                        ward,
                        routeType,
                        description: `Imported from CSV - Ward: ${ward}`,
                        totalStops: stopsData.length
                    });

                    if (stopsData.length > 0) {
                        const stopDocs = stopsData.map(stop => ({
                            routeId: route._id,
                            ...stop
                        }));
                        await RouteStop.insertMany(stopDocs);
                    }
                    successCount++;
                }

                res.status(201).json({ message: `Import complete! Successfully imported: ${successCount} routes. Skipped/Errors: ${errorCount}.` });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Error processing CSV data', error: err.message });
            }
        });
};

// @desc    Get route by ID with stops
// @route   GET /api/routes/:id
// @access  Private/Admin
const getRouteById = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (route) {
            const stops = await RouteStop.find({ routeId: route._id }).sort({ sequenceNumber: 1 });
            res.json({ ...route.toObject(), stops });
        } else {
            res.status(404).json({ message: 'Route not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private/Admin
const deleteRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (route) {
            await RouteStop.deleteMany({ routeId: route._id });
            await route.remove();
            res.json({ message: 'Route removed' });
        } else {
            res.status(404).json({ message: 'Route not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private/Admin
const updateRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (route) {
            route.routeName = req.body.routeName !== undefined ? req.body.routeName : route.routeName;
            route.description = req.body.description !== undefined ? req.body.description : route.description;
            route.ward = req.body.ward !== undefined ? req.body.ward : route.ward;
            route.routeType = req.body.routeType !== undefined ? req.body.routeType : route.routeType;
            
            const updatedRoute = await route.save();
            res.json(updatedRoute);
        } else {
            res.status(404).json({ message: 'Route not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Assign route to driver
// @route   POST /api/routes/assign
// @access  Private/Admin
const assignRoute = async (req, res) => {
    const { routeId, driverId, assignedDate } = req.body;

    try {
        const assignment = await RouteAssignment.create({
            routeId,
            driverId,
            assignedDate,
            status: 'assigned',
        });

        res.status(201).json(assignment);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get assigned routes for a driver
// @route   GET /api/routes/assigned/:driverId
// @access  Private (Driver or Admin)
const getAssignedRoutes = async (req, res) => {
    try {
        const assignments = await RouteAssignment.find({ driverId: req.params.driverId })
            .populate('routeId')
            .sort({ assignedDate: -1 });
        
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all route assignments (for Admin)
// @route   GET /api/routes/assignments/all
// @access  Private/Admin
const getAllAssignments = async (req, res) => {
    try {
        const assignments = await RouteAssignment.find({})
            .populate('routeId')
            .populate('driverId', 'name mobile ward')
            .sort({ createdAt: -1 });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get assignment by ID with route and stops
// @route   GET /api/routes/assignment/:id
// @access  Private
const getAssignmentById = async (req, res) => {
    try {
        const assignment = await RouteAssignment.findById(req.params.id).populate('routeId');
        if (assignment) {
            const stops = await RouteStop.find({ routeId: assignment.routeId._id }).sort({ sequenceNumber: 1 });
            const RouteProgress = require('../models/RouteProgress');
            const progress = await RouteProgress.find({ assignmentId: assignment._id });
            res.json({ assignment, route: assignment.routeId, stops, progress });
        } else {
            res.status(404).json({ message: 'Assignment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update assignment (driver, route, date)
// @route   PUT /api/routes/assignment/:id
// @access  Private/Admin
const updateAssignment = async (req, res) => {
    try {
        const assignment = await RouteAssignment.findById(req.params.id);
        if (assignment) {
            assignment.driverId = req.body.driverId || assignment.driverId;
            assignment.routeId = req.body.routeId || assignment.routeId;
            assignment.assignedDate = req.body.assignedDate || assignment.assignedDate;
            
            const updatedAssignment = await assignment.save();
            res.json(updatedAssignment);
        } else {
            res.status(404).json({ message: 'Assignment not found' });
        }
    } catch (error) {
        console.error('Update Assignment Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete assignment
// @route   DELETE /api/routes/assignment/:id
// @access  Private/Admin
const deleteAssignment = async (req, res) => {
    try {
        const assignment = await RouteAssignment.findById(req.params.id);
        if (assignment) {
            await assignment.deleteOne();
            res.json({ message: 'Assignment removed' });
        } else {
            res.status(404).json({ message: 'Assignment not found' });
        }
    } catch (error) {
        console.error('Delete Assignment Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
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
};
