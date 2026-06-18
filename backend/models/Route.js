const mongoose = require('mongoose');

const routeSchema = mongoose.Schema({
    routeId: {
        type: String,
        unique: true,
        sparse: true,
    },
    routeName: {
        type: String,
        required: true,
    },
    ward: {
        type: String,
    },
    zone: {
        type: String,
    },
    routeType: {
        type: String,
    },
    description: {
        type: String,
    },
    totalDistance: {
        type: Number,
        default: 0,
    },
    totalStops: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true,
});

const Route = mongoose.model('Route', routeSchema);
module.exports = Route;
