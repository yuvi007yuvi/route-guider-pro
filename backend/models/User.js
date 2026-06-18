const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['admin', 'driver'],
    },
    name: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    vehicleNumber: {
        type: String, // Only for drivers
    },
    ward: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    }
}, {
    timestamps: true,
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
