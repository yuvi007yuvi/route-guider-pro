const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing users just in case
        await User.deleteMany();

        await User.create({
            name: 'Admin User',
            mobile: 'admin',
            password: 'password123',
            role: 'admin',
        });

        await User.create({
            name: 'Driver John',
            mobile: 'driver',
            password: 'password123',
            role: 'driver',
            vehicleNumber: 'ABC-1234',
        });

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedData();
