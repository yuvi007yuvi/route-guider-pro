const RouteProgress = require('../models/RouteProgress');
const RouteAssignment = require('../models/RouteAssignment');
const RouteStop = require('../models/RouteStop');
const Route = require('../models/Route');

// @desc    Complete a stop
// @route   POST /api/stops/complete
// @access  Private (Driver)
const completeStop = async (req, res) => {
    const { assignmentId, stopId, remarks } = req.body;

    try {
        const assignment = await RouteAssignment.findById(assignmentId);
        if (!assignment || assignment.driverId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to complete this stop' });
        }

        // Change assignment status to in_progress if it was assigned
        if (assignment.status === 'assigned') {
            assignment.status = 'in_progress';
            await assignment.save();
        }

        const progress = await RouteProgress.create({
            assignmentId,
            stopId,
            remarks,
        });

        res.status(201).json(progress);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Complete a route
// @route   POST /api/routes/complete
// @access  Private (Driver)
const completeRoute = async (req, res) => {
    const { assignmentId } = req.body;

    try {
        const assignment = await RouteAssignment.findById(assignmentId);
        if (!assignment || assignment.driverId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to complete this route' });
        }

        assignment.status = 'completed';
        await assignment.save();

        res.json({ message: 'Route completed successfully', assignment });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    completeStop,
    completeRoute,
};
