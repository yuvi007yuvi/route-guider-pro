const mongoose = require('mongoose');

const routeAssignmentSchema = mongoose.Schema({
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Route',
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Refers to a User with role 'driver'
    },
    assignedDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['assigned', 'in_progress', 'completed'],
        default: 'assigned',
    }
}, {
    timestamps: true,
});

const RouteAssignment = mongoose.model('RouteAssignment', routeAssignmentSchema);
module.exports = RouteAssignment;
