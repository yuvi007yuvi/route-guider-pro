const mongoose = require('mongoose');

const routeProgressSchema = mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'RouteAssignment',
    },
    stopId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'RouteStop',
    },
    completedAt: {
        type: Date,
        default: Date.now,
    },
    remarks: {
        type: String,
    }
}, {
    timestamps: true,
});

const RouteProgress = mongoose.model('RouteProgress', routeProgressSchema);
module.exports = RouteProgress;
