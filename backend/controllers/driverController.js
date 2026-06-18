const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private/Admin
const getDrivers = async (req, res) => {
    try {
        const drivers = await User.find({}).select('-password');
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a driver
// @route   POST /api/drivers
// @access  Private/Admin
const createDriver = async (req, res) => {
    const { name, mobile, password, vehicleNumber, role, ward } = req.body;

    try {
        const driverExists = await User.findOne({ mobile });

        if (driverExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const driver = await User.create({
            role: role || 'driver',
            name,
            mobile,
            password, 
            vehicleNumber,
            ward,
        });

        if (driver) {
            res.status(201).json({
                _id: driver._id,
                name: driver.name,
                mobile: driver.mobile,
                vehicleNumber: driver.vehicleNumber,
                status: driver.status,
            });
        } else {
            res.status(400).json({ message: 'Invalid driver data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a driver
// @route   PUT /api/drivers/:id
// @access  Private/Admin
const updateDriver = async (req, res) => {
    const { name, mobile, vehicleNumber, status, password, role, ward } = req.body;

    try {
        const driver = await User.findById(req.params.id);

        if (driver) {
            driver.name = name || driver.name;
            driver.mobile = mobile || driver.mobile;
            driver.vehicleNumber = vehicleNumber !== undefined ? vehicleNumber : driver.vehicleNumber;
            driver.status = status || driver.status;
            driver.role = role || driver.role;
            driver.ward = ward !== undefined ? ward : driver.ward;
            
            if (password) {
                driver.password = password; // pre-save hook will hash it
            }

            const updatedDriver = await driver.save();

            res.json({
                _id: updatedDriver._id,
                name: updatedDriver.name,
                mobile: updatedDriver.mobile,
                vehicleNumber: updatedDriver.vehicleNumber,
                status: updatedDriver.status,
            });
        } else {
            res.status(404).json({ message: 'Driver not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a driver
// @route   DELETE /api/drivers/:id
// @access  Private/Admin
const deleteDriver = async (req, res) => {
    try {
        const driver = await User.findById(req.params.id);

        if (driver) {
            // Wait, mongoose 6+ uses deleteOne instead of remove
            await User.deleteOne({ _id: driver._id });
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'Driver not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Reset a driver's password
// @route   PUT /api/drivers/:id/reset-password
// @access  Private/Admin
const resetDriverPassword = async (req, res) => {
    const { newPassword } = req.body;

    try {
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const driver = await User.findById(req.params.id);

        if (driver) {
            driver.password = newPassword;
            await driver.save();
            res.json({ message: 'Password reset successfully' });
        } else {
            res.status(404).json({ message: 'Driver not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
    resetDriverPassword,
};
