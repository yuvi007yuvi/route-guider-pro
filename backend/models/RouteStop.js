const mongoose = require('mongoose');

const routeStopSchema = mongoose.Schema({
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Route',
    },
    stopName: {
        type: String,
        required: true,
    },
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    sequenceNumber: {
        type: Number,
        required: true,
    }
}, {
    timestamps: true,
});

const RouteStop = mongoose.model('RouteStop', routeStopSchema);
module.exports = RouteStop;
